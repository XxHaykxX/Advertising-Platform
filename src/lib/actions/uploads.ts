"use server";

// Content-editor gate, not plain requireUser(): every caller of these actions
// is an admin content tool (media manager, MediaPicker in the project/portfolio
// forms), and staff roles that never edit content — MODERATOR, TRANSLATOR —
// must not be able to reach the media library by POSTing the action directly.
// Members have their own scoped path in src/lib/actions/member-uploads.ts.
import { requireContentEditor } from "@/lib/auth/require";
import { keyToPublicPath, publicPathToKey, storage } from "@/lib/storage";
import { findUploadUsage, type UploadUsage } from "@/lib/uploads-usage";
import { STAFF_UPLOAD_MESSAGES, storeUpload } from "@/lib/uploads-store";

// Where the bytes actually live is the storage driver's business now (local
// disk under UPLOADS_DIR, or S3 — see src/lib/storage). What stays fixed either
// way is the "/uploads/…" path in the database: publicPathToKey() is the only
// way in, and it rejects anything that is not a safe path inside that tree.

export type UploadResult = { path?: string; error?: string; warning?: string };

/** Staff upload, no progress reporting: the browser can't report how far a
 *  Server Action's body has got, so every field that shows a progress bar posts
 *  to /api/uploads instead (see src/lib/upload-xhr.ts). Both doors share the
 *  same validation + write in lib/uploads-store.ts; only the gate differs. */
export async function uploadImage(fd: FormData): Promise<UploadResult> {
  await requireContentEditor();
  return storeUpload(fd, {
    // No prefix: staff own the whole tree, members/* included.
    keyPrefix: "",
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
  const key = publicPathToKey(publicPath);
  if (!key) return { error: "Invalid path." };

  if (!opts?.force) {
    const usage = await findUploadUsage(publicPath);
    if (usage.current.length || usage.history.length) return { usage };
  }

  // Already gone counts as done — the driver swallows a missing key so the UI
  // can prune a stale entry either way.
  await storage().remove(key);
  return { ok: true };
}

export type MediaFile = { path: string; size: number; mtime: number };

/** Every uploaded file, for the media manager. */
export async function listUploads(): Promise<MediaFile[]> {
  await requireContentEditor();
  // "" = the whole tree. The driver returns it already sorted newest-first.
  const files = await storage().list("");
  return files.map((f) => ({ path: keyToPublicPath(f.key), size: f.size, mtime: f.mtime }));
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
  const key = publicPathToKey(videoPath);
  if (!key) return { error: "Invalid path." };

  const store = storage();
  // The clip has to exist: this button attaches a poster to something already
  // referenced by a project, and writing "<missing>.jpg" would leave an orphan
  // nothing ever reads.
  if (!(await store.head(key))) return { error: "File not found." };

  const poster = fd.get("poster");
  if (!(poster instanceof File) || poster.size === 0) return { error: "No poster provided." };
  if (poster.size > 2 * 1024 * 1024) return { error: "Poster too large." };

  try {
    await store.put(`${key}.jpg`, Buffer.from(await poster.arrayBuffer()), {
      contentType: "image/jpeg",
    });
  } catch {
    return { error: "Could not write the poster." };
  }
  return { ok: true };
}
