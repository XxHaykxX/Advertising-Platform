import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { parseRange } from "@/lib/http-range";
import { UPLOADS_DIR } from "@/lib/uploads-dir";

// Serves uploaded/generated images from UPLOADS_DIR over the same /uploads/…
// URLs the app has always stored in the DB. This exists because Hostinger's
// front static proxy serves the domain docroot, not `public/uploads` — so when
// UPLOADS_DIR points OUTSIDE public_html (as it must on prod, to survive git
// deploys and to be writable), Next's built-in static handler can't reach the
// files. This Node route reads them straight off disk instead, guaranteeing the
// write path == the serve path. Locally (UPLOADS_DIR unset) files also still
// live in public/uploads, so nothing regresses.
export const dynamic = "force-dynamic";

const CONTENT_TYPE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;

  // Resolve against UPLOADS_DIR and reject anything that escapes it (../ etc.).
  const abs = path.resolve(UPLOADS_DIR, ...segments);
  if (abs !== UPLOADS_DIR && !abs.startsWith(UPLOADS_DIR + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const s = await stat(abs);
    if (!s.isFile()) return new Response("Not found", { status: 404 });
    const ext = path.extname(abs).toLowerCase();
    const type = CONTENT_TYPE[ext] || "application/octet-stream";
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
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
