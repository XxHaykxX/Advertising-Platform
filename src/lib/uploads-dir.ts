import path from "node:path";

// Single source of truth for where uploaded/generated images live on disk.
//
// On Hostinger, `next start` runs with a working directory that is NOT
// guaranteed to be the app folder, and the front static proxy serves the
// domain docroot — not `public/uploads`. So the old
// `process.cwd()/public/uploads` convention could write to one place while the
// server tried to serve/list from another: posters got generated (the paid
// image API call succeeded) but were never shown, and the admin Media list came
// up empty. Pin an ABSOLUTE, writable, persistent directory via the UPLOADS_DIR
// env var (set it in hPanel to a path OUTSIDE public_html so git auto-deploys
// never wipe it, e.g. /home/u998961932/domains/igovazd.am/uploads). Files are
// served back through the Node route at app/uploads/[...path]/route.ts, so the
// write path, the list path and the serve path are always the exact same dir.
//
// Local dev falls back to the original public/uploads, so nothing changes there
// and existing dev files keep working.
//
// Prod safety net: on Hostinger the app runs from …/domains/<domain>/nodejs and
// that WHOLE dir is replaced on every git deploy — so writing inside it (the old
// process.cwd()/public/uploads) silently wiped every upload on each push. If
// UPLOADS_DIR isn't set, in production we therefore default to a sibling
// `uploads` dir ONE LEVEL ABOVE cwd (…/domains/<domain>/uploads), which lives
// outside the replaced app dir and survives deploys. Setting UPLOADS_DIR
// explicitly (in the hPanel Node.js env UI) still overrides this.
function resolveUploadsDir(): string {
  if (process.env.UPLOADS_DIR) return path.resolve(process.env.UPLOADS_DIR);
  if (process.env.NODE_ENV === "production") {
    return path.resolve(process.cwd(), "..", "uploads");
  }
  return path.join(process.cwd(), "public", "uploads");
}

export const UPLOADS_DIR = resolveUploadsDir();
