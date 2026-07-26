"use server";

// Member-safe uploads (BRAND / CREATOR). Everything a member uploads lives under
// /uploads/members/<userId>/<dir>/… so a member's picker can list ONLY their own
// files, while staff (admin Media / picker) still see the whole /uploads tree
// (listUploads walks it recursively, members/* included). The shared uploadImage
// in ./uploads.ts is staff-only (requireUser); these are the member twins,
// gated by requireMember and hard-scoped to the caller's own folder.
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { UPLOADS_DIR } from "@/lib/uploads-dir";
import { findUploadUsage } from "@/lib/uploads-usage";
import { optimizeImage, kindForDir } from "@/lib/images/optimize";
import type { MediaFile } from "@/lib/actions/uploads";

const MEMBERS_ROOT = path.join(UPLOADS_DIR, "members");
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
// Video branch (#10 project trailer upload) — kept small, shared hosting.
const MAX_BYTES_VIDEO = 50 * 1024 * 1024; // 50 MB
const EXT_BY_TYPE_VIDEO: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};

function safeSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 64) || "misc";
}

export async function uploadMemberImage(fd: FormData): Promise<{ path?: string; error?: string }> {
  const me = await requireMember();
  // Audit 4.5: these messages surface directly in a member's cabinet, which is
  // in their own language — they used to be hardcoded English.
  const t = makeUI(await getLocale());

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: t("media.errNoFile") };

  const dir = safeSegment(String(fd.get("dir") || "misc"));
  const kind = String(fd.get("kind") || "image");

  // Same folder/type rule as the staff uploader (see uploads.ts): clips belong
  // in "videos", stills everywhere else, "references" takes both.
  if (dir === "videos" && kind !== "video") return { error: t("media.errUnsupportedVideo") };
  if (dir !== "videos" && kind === "video" && dir !== "references") {
    return { error: t("media.errUnsupportedImage") };
  }

  if (kind === "video") {
    if (file.size > MAX_BYTES_VIDEO) {
      return { error: t("media.errTooLargeServer", { limit: String(MAX_BYTES_VIDEO / (1024 * 1024)) }) };
    }
    // See uploads.ts: fall back to the filename extension when the browser sends
    // a blank/non-standard MIME for an otherwise valid mp4/webm.
    const ext = EXT_BY_TYPE_VIDEO[file.type] || file.name.toLowerCase().match(/\.(mp4|webm)$/)?.[1];
    if (!ext) return { error: t("media.errUnsupportedVideo") };

    const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const destDir = path.join(MEMBERS_ROOT, String(me.id), dir);
    await mkdir(destDir, { recursive: true });
    await writeFile(path.join(destDir, name), Buffer.from(await file.arrayBuffer()));
    await writePosterFrame(fd, destDir, name);

    return { path: `/uploads/members/${me.id}/${dir}/${name}` };
  }

  if (file.size > MAX_BYTES) {
    return { error: t("media.errTooLargeServer", { limit: String(MAX_BYTES / (1024 * 1024)) }) };
  }
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) return { error: t("media.errUnsupportedImage") };

  let optimized;
  try {
    optimized = await optimizeImage(Buffer.from(await file.arrayBuffer()), kindForDir(dir));
  } catch {
    return { error: t("media.loadError") };
  }

  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${optimized.ext}`;
  const destDir = path.join(MEMBERS_ROOT, String(me.id), dir);
  await mkdir(destDir, { recursive: true });
  await writeFile(path.join(destDir, name), optimized.buffer);

  return { path: `/uploads/members/${me.id}/${dir}/${name}` };
}

/** Lists ONLY the current member's own uploads (recursively under their
 *  namespace), newest first. */
export async function listMemberUploads(): Promise<MediaFile[]> {
  const me = await requireMember();
  const root = path.join(MEMBERS_ROOT, String(me.id));
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
        out.push({ path: `/uploads/members/${me.id}${childRel}`, size: s.size, mtime: s.mtimeMs });
      }
    }
  }

  await walk(root, "");
  return out.sort((a, b) => b.mtime - a.mtime);
}

export async function deleteMemberUpload(
  publicPath: string,
): Promise<{ ok?: boolean; error?: string; usedBy?: string[] }> {
  const me = await requireMember();

  // Hard-scope: a member can only delete files inside their own namespace.
  const prefix = `/uploads/members/${me.id}/`;
  if (!publicPath.startsWith(prefix)) return { error: "Invalid path." };
  const rel = publicPath.slice("/uploads/".length);
  const abs = path.resolve(UPLOADS_DIR, rel);
  if (abs !== UPLOADS_DIR && !abs.startsWith(UPLOADS_DIR + path.sep)) return { error: "Invalid path." };

  const usedBy = await findUploadUsage(publicPath);
  if (usedBy.length) {
    return { error: `In use — can't delete. Referenced by: ${usedBy.join("; ")}`, usedBy };
  }

  try {
    await unlink(abs);
  } catch {
    // already gone — treat as success
  }
  return { ok: true };
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
