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
export const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(process.cwd(), "public", "uploads");
