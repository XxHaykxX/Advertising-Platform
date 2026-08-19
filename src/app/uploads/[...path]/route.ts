import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { parseRange } from "@/lib/http-range";
import { contentTypeForKey, isSafeKey, storage } from "@/lib/storage";
import { UPLOADS_DIR } from "@/lib/uploads-dir";

// Serves uploaded/generated files over the same /uploads/… URLs the app has
// always stored in the DB.
//
// On the fs driver (local dev, and Hostinger until the cutover) it reads
// straight off disk. It exists because Hostinger's front static proxy serves
// the domain docroot, not `public/uploads` — so when UPLOADS_DIR points OUTSIDE
// public_html (as it must on prod, to survive git deploys and to be writable),
// Next's built-in static handler can't reach the files. This Node route reads
// them instead, guaranteeing the write path == the serve path.
//
// On the s3 driver this route is a *fallback*, not the normal path: in
// production CloudFront has a `/uploads/*` behaviour pointing at the bucket, so
// these requests never reach the app at all. What is left here is for anyone
// who hits the origin directly — a redirect to the CDN, which also means S3
// keeps handling byte ranges itself rather than us re-implementing them.
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;
  const key = segments.join("/");
  if (!isSafeKey(key)) return new Response("Not found", { status: 404 });

  const store = storage();

  if (store.name === "s3") {
    const url = store.publicUrl(key);
    // 302, not 308: the object is immutable but the CDN hostname is not, and a
    // permanent redirect would be cached by browsers past any change to it.
    if (url) return Response.redirect(url, 302);

    // s3 without CDN_BASE_URL — a misconfiguration rather than a mode. Serve the
    // bytes so nothing is *broken*, but note that this path has no Range
    // support, which Safari needs to play a video at all.
    const buf = await store.get(key);
    if (!buf) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": contentTypeForKey(key),
        "Content-Length": String(buf.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // Resolve against UPLOADS_DIR and reject anything that escapes it. isSafeKey
  // above is the fence; this is the second check, kept for the same reason it
  // always was — one predicate is not a thing to trust forever.
  const abs = path.resolve(UPLOADS_DIR, key);
  if (abs !== UPLOADS_DIR && !abs.startsWith(UPLOADS_DIR + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const s = await stat(abs);
    if (!s.isFile()) return new Response("Not found", { status: 404 });
    const type = contentTypeForKey(key);
    const isVideo = type.startsWith("video/");

    // Video needs byte ranges: Chrome/Safari request "Range: bytes=0-" for a
    // <video> and Safari refuses to play at all without a 206. Answering with
    // the whole file also meant a 50 MB trailer was buffered into memory on
    // shared hosting — the "MP4 upload doesn't work" report was really "the
    // uploaded MP4 doesn't play". Images keep the simple buffered path.
    if (isVideo) {
      const range = parseRange(req.headers.get("range"), s.size);
      const [start, end] = range ?? [0, s.size - 1];
      const stream = Readable.toWeb(
        createReadStream(abs, { start, end }),
      ) as unknown as ReadableStream<Uint8Array>;
      return new Response(stream, {
        status: range ? 206 : 200,
        headers: {
          "Content-Type": type,
          "Content-Length": String(end - start + 1),
          "Accept-Ranges": "bytes",
          ...(range ? { "Content-Range": `bytes ${start}-${end}/${s.size}` } : {}),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const buf = await readFile(abs);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(s.size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
        // A PDF is the one thing here that a browser will happily open INSIDE
        // our own origin, where its embedded scripting would run as us. It is
        // also the one thing nobody wants rendered in place — the only link to
        // it says "Download presentation". Forcing the attachment disposition
        // settles both (IA-44, 2026-08-05). The s3 driver stores the same
        // header on the object, since CloudFront answers without asking us.
        ...(type === "application/pdf" ? { "Content-Disposition": "attachment" } : {}),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
