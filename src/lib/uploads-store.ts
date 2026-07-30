// Server-only. The validation + persistence half of an upload, without an auth
// gate of its own: the caller decides who is allowed in.
//
// It exists because there are now TWO front doors to the same write — the
// "use server" action in src/lib/actions/uploads.ts and the multipart route
// handler in src/app/api/uploads/route.ts (added so the browser can report
// real upload progress, which it never does for a Server Action). Those two
// must accept and reject exactly the same files; a second hand-written copy of
// the rules is how an upload endpoint quietly ends up laxer than the action it
// shadows. A "use server" file can only export async functions, so the shared
// part cannot live there — hence a plain module.
import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { optimizeImage, kindForDir } from "@/lib/images/optimize";

export const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
// Video branch (project trailer upload, #10): no sharp pass — the file is
// stored as-is. Kept small since this runs on Hostinger shared hosting.
export const MAX_BYTES_VIDEO = 50 * 1024 * 1024; // 50 MB

/** Ceiling for a whole multipart body, for a front door that wants to reject a
 *  hostile request before reading it. Deliberately the LARGEST thing this
 *  endpoint legitimately carries plus room for what rides along with it: a 50 MB
 *  clip is posted together with its captured poster frame (up to 2 MB, see
 *  writePosterFrame) and the multipart boundaries/headers of four parts. It is
 *  not a substitute for the per-kind caps above — those decide what is actually
 *  accepted, and they run on the parsed file, not on a client-supplied header. */
export const MAX_BODY_BYTES = MAX_BYTES_VIDEO + 4 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const EXT_BY_TYPE_VIDEO: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};

/** Keep only a safe folder segment (project code etc.) — strip anything that
   could escape the uploads root. */
export function safeSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 64) || "misc";
}

/** Every rejection the store can produce. Passed in rather than hardcoded: the
 *  admin panel is pinned to English while a member sees their cabinet in their
 *  own language, and both go through this same code. */
export type UploadMessages = {
  noFile: string;
  /** A still aimed at the Videos folder. */
  notAVideo: string;
  /** A clip aimed at a stills folder. */
  notAnImage: string;
  tooLargeImage: string;
  tooLargeVideo: string;
  unsupportedImage: string;
  unsupportedVideo: string;
  processFailed: string;
};

/** Admin-panel wording — English, matching the rest of /admin. */
export const STAFF_UPLOAD_MESSAGES: UploadMessages = {
  noFile: "No file provided.",
  notAVideo: "This folder only takes MP4 / WebM.",
  notAnImage: "Upload videos to the Videos folder.",
  tooLargeImage: "File too large (max 8 MB).",
  tooLargeVideo: "File too large (max 50 MB).",
  unsupportedImage: "Unsupported type — use JPG, PNG, WebP, GIF or AVIF.",
  unsupportedVideo: "Unsupported type — use MP4 or WebM.",
  processFailed: "Could not process image.",
};

/** Member wording — these land in a cabinet rendered in the visitor's own
 *  language (audit 4.5), so they come from the dictionary. */
export function memberUploadMessages(
  t: (key: string, vars?: Record<string, string | number>) => string,
): UploadMessages {
  return {
    noFile: t("media.errNoFile"),
    notAVideo: t("media.errUnsupportedVideo"),
    notAnImage: t("media.errUnsupportedImage"),
    tooLargeImage: t("media.errTooLargeServer", { limit: String(MAX_BYTES / (1024 * 1024)) }),
    tooLargeVideo: t("media.errTooLargeServer", { limit: String(MAX_BYTES_VIDEO / (1024 * 1024)) }),
    unsupportedImage: t("media.errUnsupportedImage"),
    unsupportedVideo: t("media.errUnsupportedVideo"),
    processFailed: t("media.loadError"),
  };
}

export type StoreUploadOptions = {
  /** Absolute directory the file is written under. Staff: the uploads root.
   *  Member: that member's own namespace, so `dir` can never reach anyone
   *  else's files even before safeSegment() gets involved. */
  root: string;
  /** Public prefix the returned path is built from — "/uploads" for staff,
   *  "/uploads/members/<id>" for a member. */
  publicPrefix: string;
  messages: UploadMessages;
};

export type StoredUpload = { path?: string; error?: string };

/** Validate a multipart upload and write it. Identical rules whichever front
 *  door called: the folder/type rule, the per-kind size cap, the MIME/extension
 *  allowlist, the sharp pass for stills and the poster frame for clips. */
export async function storeUpload(fd: FormData, opts: StoreUploadOptions): Promise<StoredUpload> {
  const { root, publicPrefix, messages } = opts;

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: messages.noFile };

  const dir = safeSegment(String(fd.get("dir") || "misc"));
  const kind = String(fd.get("kind") || "image");

  // The Videos folder holds clips, everything else holds stills (user request
  // 2026-07-26). The client already filters, but a direct call must not be able
  // to drop a JPEG into /uploads/videos or a clip among the posters.
  // "references" is the one folder that legitimately takes both: a past project
  // may be shown as a still OR as a clip.
  const MIXED_DIRS = new Set(["references"]);
  if (dir === "videos" && kind !== "video") return { error: messages.notAVideo };
  if (dir !== "videos" && kind === "video" && !MIXED_DIRS.has(dir)) {
    return { error: messages.notAnImage };
  }

  if (kind === "video") {
    if (file.size > MAX_BYTES_VIDEO) return { error: messages.tooLargeVideo };
    // Trust file.type first; some browsers/OSes send a blank or non-standard MIME
    // for .mp4 (e.g. "application/octet-stream"), so fall back to the filename
    // extension (whitelisted to mp4/webm) before rejecting.
    const ext = EXT_BY_TYPE_VIDEO[file.type] || file.name.toLowerCase().match(/\.(mp4|webm)$/)?.[1];
    if (!ext) return { error: messages.unsupportedVideo };

    const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const destDir = path.join(root, dir);
    await mkdir(destDir, { recursive: true });
    await writeFile(path.join(destDir, name), Buffer.from(await file.arrayBuffer()));
    await writePosterFrame(fd, destDir, name);

    return { path: `${publicPrefix}/${dir}/${name}` };
  }

  if (file.size > MAX_BYTES) return { error: messages.tooLargeImage };
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) return { error: messages.unsupportedImage };

  // Optimize (resize + recompress) to the target for this dir before saving.
  let optimized;
  try {
    optimized = await optimizeImage(Buffer.from(await file.arrayBuffer()), kindForDir(dir));
  } catch {
    return { error: messages.processFailed };
  }

  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${optimized.ext}`;
  const destDir = path.join(root, dir);
  await mkdir(destDir, { recursive: true });
  await writeFile(path.join(destDir, name), optimized.buffer);

  return { path: `${publicPrefix}/${dir}/${name}` };
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
