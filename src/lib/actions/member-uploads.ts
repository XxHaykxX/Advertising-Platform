"use server";

// Member-safe uploads (BRAND / CREATOR). Everything a member uploads lives under
// /uploads/members/<userId>/<dir>/… so a member's picker can list ONLY their own
// files, while staff (admin Media / picker) still see the whole /uploads tree
// (listUploads walks it recursively, members/* included). The shared uploadImage
// in ./uploads.ts is staff-only (requireUser); these are the member twins,
// gated by requireMember and hard-scoped to the caller's own folder.
import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { UPLOADS_DIR } from "@/lib/uploads-dir";
import { findUploadUsage } from "@/lib/uploads-usage";
import { memberUploadMessages, storeUpload } from "@/lib/uploads-store";
import type { MediaFile } from "@/lib/actions/uploads";

const MEMBERS_ROOT = path.join(UPLOADS_DIR, "members");

/** Member upload, no progress reporting — the twin of uploadImage. The rules
 *  and the write are the shared ones in lib/uploads-store.ts; what makes this
 *  the MEMBER door is the gate plus the root: everything lands under that
 *  member's own namespace, so the `dir` field can only ever choose a subfolder
 *  of it. Fields that show a progress bar post to /api/uploads?scope=member
 *  instead, which runs this same pair of decisions. */
export async function uploadMemberImage(fd: FormData): Promise<{ path?: string; error?: string }> {
  const me = await requireMember();
  // Audit 4.5: these messages surface directly in a member's cabinet, which is
  // in their own language — they used to be hardcoded English.
  const t = makeUI(await getLocale());

  return storeUpload(fd, {
    root: path.join(MEMBERS_ROOT, String(me.id)),
    publicPrefix: `/uploads/members/${me.id}`,
    messages: memberUploadMessages(t),
  });
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
