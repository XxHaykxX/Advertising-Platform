"use server";

import { writeFile, unlink, readdir, stat } from "node:fs/promises";
import path from "node:path";
// Content-editor gate, not plain requireUser(): every caller of these actions
// is an admin content tool (media manager, MediaPicker in the project/portfolio
// forms), and staff roles that never edit content — MODERATOR, TRANSLATOR —
// must not be able to reach the media library by POSTing the action directly.
// Members have their own scoped path in src/lib/actions/member-uploads.ts.
import { requireContentEditor } from "@/lib/auth/require";
import { UPLOADS_DIR } from "@/lib/uploads-dir";
import { findUploadUsage, type UploadUsage } from "@/lib/uploads-usage";
import { STAFF_UPLOAD_MESSAGES, storeUpload } from "@/lib/uploads-store";

// All uploads live under UPLOADS_DIR (see that module — an env-pinned absolute
// path on Hostinger, public/uploads locally) and are served as /uploads/… by
// the Node route at app/uploads/[...path]/route.ts. On Hostinger the Node
// process is long-lived, so files written at runtime persist on disk.
const UPLOAD_ROOT = UPLOADS_DIR;

export type UploadResult = { path?: string; error?: string; warning?: string };

/** Reject any path that isn't a real /uploads/… file (blocks ../ traversal). */
function resolveInsideUploads(publicPath: string): string | null {
  if (!publicPath.startsWith("/uploads/")) return null;
  const rel = publicPath.slice("/uploads/".length);
  const abs = path.resolve(UPLOAD_ROOT, rel);
  if (abs !== UPLOAD_ROOT && !abs.startsWith(UPLOAD_ROOT + path.sep)) return null;
  return abs;
}

/** Staff upload, no progress reporting: the browser can't report how far a
 *  Server Action's body has got, so every field that shows a progress bar posts
 *  to /api/uploads instead (see src/lib/upload-xhr.ts). Both doors share the
 *  same validation + write in lib/uploads-store.ts; only the gate differs. */
export async function uploadImage(fd: FormData): Promise<UploadResult> {
  await requireContentEditor();
  return storeUpload(fd, {
    root: UPLOAD_ROOT,
    publicPrefix: "/uploads",
    messages: STAFF_UPLOAD_MESSAGES,
  });
}

/** Deleting is always allowed — the caller decides, after seeing what it would
 *  affect. Without `force`, a file that's referenced anywhere (live or only in
 *  old versions) isn't touched: `usage` comes back instead of a delete, so the
 *  UI can show the consequences before asking to confirm. A file with nothing
 *  to report deletes immediately, no confirmation needed. Pass `force: true`
 *  (after the user confirmed) to delete regardless of what's referencing it. */
export async function deleteUpload(
  publicPath: string,
  opts?: { force?: boolean },
): Promise<{ ok?: boolean; error?: string; usage?: UploadUsage }> {
  await requireContentEditor();
  const abs = resolveInsideUploads(publicPath);
  if (!abs) return { error: "Invalid path." };

  if (!opts?.force) {
    const usage = await findUploadUsage(publicPath);
    if (usage.current.length || usage.history.length) return { usage };
  }

  try {
    await unlink(abs);
  } catch {
    // already gone — treat as success so the UI can prune it
  }
  return { ok: true };
}

export type MediaFile = { path: string; size: number; mtime: number };

/** Recursively list every uploaded file for the media manager. */
export async function listUploads(): Promise<MediaFile[]> {
  await requireContentEditor();
  const out: MediaFile[] = [];
  async function walk(abs: string, rel: string) {
    let entries;
    try {
      entries = await readdir(abs, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const childAbs = path.join(abs, e.name);
      const childRel = `${rel}/${e.name}`;
      if (e.isDirectory()) {
        await walk(childAbs, childRel);
      } else {
        const s = await stat(childAbs);
        out.push({ path: `/uploads${childRel}`, size: s.size, mtime: s.mtimeMs });
      }
    }
  }
  await walk(UPLOAD_ROOT, "");
  return out.sort((a, b) => b.mtime - a.mtime);
}

/** Attach a poster frame to a video that's already stored.
 *
 *  Used by the media library's "Generate thumbnails" button for clips uploaded
 *  before poster capture existed. Deliberately does NOT re-upload the video:
 *  the stored path is referenced by projects (Project.videoFile, reference
 *  rows), so replacing the file would break those links. */
export async function saveVideoPoster(fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  await requireContentEditor();

  const videoPath = String(fd.get("videoPath") || "");
  if (!/^\/uploads\/[\w./-]+\.(mp4|webm)$/i.test(videoPath)) return { error: "Invalid path." };

  // Resolve inside the uploads root — no traversal out of it.
  const rel = videoPath.slice("/uploads/".length);
  const abs = path.resolve(UPLOAD_ROOT, rel);
  if (abs !== UPLOAD_ROOT && !abs.startsWith(UPLOAD_ROOT + path.sep)) return { error: "Invalid path." };
  try {
    await stat(abs);
  } catch {
    return { error: "File not found." };
  }

  const poster = fd.get("poster");
  if (!(poster instanceof File) || poster.size === 0) return { error: "No poster provided." };
  if (poster.size > 2 * 1024 * 1024) return { error: "Poster too large." };

  try {
    await writeFile(`${abs}.jpg`, Buffer.from(await poster.arrayBuffer()));
  } catch {
    return { error: "Could not write the poster." };
  }
  return { ok: true };
}
