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
import { UPLOADS_DIR } from "@/lib/uploads-dir";
import { findUploadUsage } from "@/lib/uploads-usage";
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

function safeSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 64) || "misc";
}

export async function uploadMemberImage(fd: FormData): Promise<{ path?: string; error?: string }> {
  const me = await requireMember();

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided." };
  if (file.size > MAX_BYTES) return { error: "File too large (max 8 MB)." };
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) return { error: "Unsupported type — use JPG, PNG, WebP, GIF or AVIF." };

  const dir = safeSegment(String(fd.get("dir") || "misc"));
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const destDir = path.join(MEMBERS_ROOT, String(me.id), dir);
  await mkdir(destDir, { recursive: true });
  await writeFile(path.join(destDir, name), Buffer.from(await file.arrayBuffer()));

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
