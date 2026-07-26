"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink, readdir, stat } from "node:fs/promises";
import path from "node:path";
// Content-editor gate, not plain requireUser(): every caller of these actions
// is an admin content tool (media manager, MediaPicker in the project/portfolio
// forms), and staff roles that never edit content — MODERATOR, TRANSLATOR —
// must not be able to reach the media library by POSTing the action directly.
// Members have their own scoped path in src/lib/actions/member-uploads.ts.
import { requireContentEditor } from "@/lib/auth/require";
import { UPLOADS_DIR } from "@/lib/uploads-dir";
import { findUploadUsage } from "@/lib/uploads-usage";
import { optimizeImage, kindForDir } from "@/lib/images/optimize";

// All uploads live under UPLOADS_DIR (see that module — an env-pinned absolute
// path on Hostinger, public/uploads locally) and are served as /uploads/… by
// the Node route at app/uploads/[...path]/route.ts. On Hostinger the Node
// process is long-lived, so files written at runtime persist on disk.
const UPLOAD_ROOT = UPLOADS_DIR;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
// Video branch (project trailer upload, #10): no sharp pass — the file is
// stored as-is. Kept small since this runs on Hostinger shared hosting.
const MAX_BYTES_VIDEO = 50 * 1024 * 1024; // 50 MB
const EXT_BY_TYPE_VIDEO: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export type UploadResult = { path?: string; error?: string };

/** Keep only a safe folder segment (project code etc.) — strip anything that
   could escape the uploads root. */
function safeSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 64) || "misc";
}

/** Reject any path that isn't a real /uploads/… file (blocks ../ traversal). */
function resolveInsideUploads(publicPath: string): string | null {
  if (!publicPath.startsWith("/uploads/")) return null;
  const rel = publicPath.slice("/uploads/".length);
  const abs = path.resolve(UPLOAD_ROOT, rel);
  if (abs !== UPLOAD_ROOT && !abs.startsWith(UPLOAD_ROOT + path.sep)) return null;
  return abs;
}

export async function uploadImage(fd: FormData): Promise<UploadResult> {
  await requireContentEditor();

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided." };

  const dir = safeSegment(String(fd.get("dir") || "misc"));
  const kind = String(fd.get("kind") || "image");

  // The Videos folder holds clips, everything else holds stills (user request
  // 2026-07-26). The client already filters, but a direct call must not be able
  // to drop a JPEG into /uploads/videos or a clip among the posters.
  // "references" is the one folder that legitimately takes both: a past project
  // may be shown as a still OR as a clip.
  const MIXED_DIRS = new Set(["references"]);
  if (dir === "videos" && kind !== "video") return { error: "This folder only takes MP4 / WebM." };
  if (dir !== "videos" && kind === "video" && !MIXED_DIRS.has(dir)) {
    return { error: "Upload videos to the Videos folder." };
  }

  if (kind === "video") {
    if (file.size > MAX_BYTES_VIDEO) return { error: "File too large (max 50 MB)." };
    // Trust file.type first; some browsers/OSes send a blank or non-standard MIME
    // for .mp4 (e.g. "application/octet-stream"), so fall back to the filename
    // extension (whitelisted to mp4/webm) before rejecting.
    const ext = EXT_BY_TYPE_VIDEO[file.type] || file.name.toLowerCase().match(/\.(mp4|webm)$/)?.[1];
    if (!ext) return { error: "Unsupported type — use MP4 or WebM." };

    const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const destDir = path.join(UPLOAD_ROOT, dir);
    await mkdir(destDir, { recursive: true });
    await writeFile(path.join(destDir, name), Buffer.from(await file.arrayBuffer()));
    await writePosterFrame(fd, destDir, name);

    return { path: `/uploads/${dir}/${name}` };
  }

  if (file.size > MAX_BYTES) return { error: "File too large (max 8 MB)." };
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) return { error: "Unsupported type — use JPG, PNG, WebP, GIF or AVIF." };

  // Optimize (resize + recompress) to the target for this dir before saving.
  let optimized;
  try {
    optimized = await optimizeImage(Buffer.from(await file.arrayBuffer()), kindForDir(dir));
  } catch {
    return { error: "Could not process image." };
  }

  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${optimized.ext}`;
  const destDir = path.join(UPLOAD_ROOT, dir);
  await mkdir(destDir, { recursive: true });
  await writeFile(path.join(destDir, name), optimized.buffer);

  return { path: `/uploads/${dir}/${name}` };
}

export async function deleteUpload(
  publicPath: string,
): Promise<{ ok?: boolean; error?: string; usedBy?: string[] }> {
  await requireContentEditor();
  const abs = resolveInsideUploads(publicPath);
  if (!abs) return { error: "Invalid path." };

  // Guard: refuse to delete a file that's still referenced somewhere, otherwise
  // that project/portfolio/avatar would show a broken image on the live site.
  const usedBy = await findUploadUsage(publicPath);
  if (usedBy.length) {
    return { error: `In use — can't delete. Referenced by: ${usedBy.join("; ")}`, usedBy };
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

/** Store the poster frame the browser grabbed for an uploaded video, as
 *  "<video-file>.jpg" next to it.
 *
 *  Why the client sends it: a <video> tile can only paint a frame after the
 *  browser has the file's metadata, and for a 40 MB mp4 with its moov atom at
 *  the end that means downloading the whole thing — so the Videos folder sat
 *  mostly blank (user report 2026-07-26). Generating the frame server-side
 *  would need ffmpeg, which shared hosting doesn't have; the browser already
 *  decoded the file to show a preview, so it hands over a small JPEG instead.
 *  Best-effort: a missing or broken poster just means the tile falls back to
 *  the <video> element. */
async function writePosterFrame(fd: FormData, destDir: string, videoName: string) {
  const poster = fd.get("poster");
  if (!(poster instanceof File) || poster.size === 0) return;
  if (poster.size > 2 * 1024 * 1024) return; // a frame is tens of KB; ignore junk
  try {
    await writeFile(path.join(destDir, `${videoName}.jpg`), Buffer.from(await poster.arrayBuffer()));
  } catch {
    /* poster is a nicety, never fail the upload over it */
  }
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
