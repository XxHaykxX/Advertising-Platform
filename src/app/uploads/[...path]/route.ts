import { readFile, stat } from "node:fs/promises";
import path from "node:path";
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
};

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;

  // Resolve against UPLOADS_DIR and reject anything that escapes it (../ etc.).
  const abs = path.resolve(UPLOADS_DIR, ...segments);
  if (abs !== UPLOADS_DIR && !abs.startsWith(UPLOADS_DIR + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const s = await stat(abs);
    if (!s.isFile()) return new Response("Not found", { status: 404 });
    const buf = await readFile(abs);
    const type = CONTENT_TYPE[path.extname(abs).toLowerCase()] || "application/octet-stream";
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(s.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
