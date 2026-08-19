"use server";

// Member-safe uploads (BRAND / CREATOR). Everything a member uploads lives under
// /uploads/members/<userId>/<dir>/… so a member's picker can list ONLY their own
// files, while staff (admin Media / picker) still see the whole /uploads tree
// (listUploads lists it all, members/* included). The shared uploadImage
// in ./uploads.ts is staff-only (requireContentEditor); these are the member
// twins, gated by requireMember and hard-scoped to the caller's own folder.
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { joinKey, keyToPublicPath, publicPathToKey, storage } from "@/lib/storage";
import { findUploadUsage, type UploadUsage } from "@/lib/uploads-usage";
import { memberUploadMessages, planVideoUpload, storeUpload } from "@/lib/uploads-store";
import type { MediaFile, VideoUploadTicket } from "@/lib/actions/uploads";

/** The one expression of "this member's own corner of storage". Everything
 *  below derives from it, so scoping cannot be right in one action and wrong in
 *  the next. */
const memberPrefix = (userId: number) => joinKey("members", String(userId));

/** Member upload, no progress reporting — the twin of uploadImage. The rules
 *  and the write are the shared ones in lib/uploads-store.ts; what makes this
 *  the MEMBER door is the gate plus the prefix: everything lands under that
 *  member's own namespace, so the `dir` field can only ever choose a subfolder
 *  of it. Fields that show a progress bar post to /api/uploads?scope=member
 *  instead, which runs this same pair of decisions. */
export async function uploadMemberImage(fd: FormData): Promise<{ path?: string; error?: string; warning?: string }> {
  const me = await requireMember();
  // Audit 4.5: these messages surface directly in a member's cabinet, which is
  // in their own language — they used to be hardcoded English.
  const t = makeUI(await getLocale());

  return storeUpload(fd, {
    keyPrefix: memberPrefix(me.id),
    messages: memberUploadMessages(t),
  });
}

/** Lists ONLY the current member's own uploads (recursively under their
 *  namespace), newest first. */
export async function listMemberUploads(): Promise<MediaFile[]> {
  const me = await requireMember();
  const files = await storage().list(memberPrefix(me.id));
  return files.map((f) => ({ path: keyToPublicPath(f.key), size: f.size, mtime: f.mtime }));
}

/** Same "warn, don't block" contract as deleteUpload (lib/actions/uploads.ts):
 *  without `force`, a referenced file comes back as `usage` instead of being
 *  deleted; pass `force: true` once the member has confirmed. */
export async function deleteMemberUpload(
  publicPath: string,
  opts?: { force?: boolean },
): Promise<{ ok?: boolean; error?: string; usage?: UploadUsage }> {
  const me = await requireMember();

  const key = publicPathToKey(publicPath);
  // Hard-scope: a member can only delete files inside their own namespace. The
  // key is already known to be traversal-free at this point, so the prefix test
  // cannot be walked around with "members/1/../2".
  if (!key || !key.startsWith(`${memberPrefix(me.id)}/`)) return { error: "Invalid path." };

  if (!opts?.force) {
    const usage = await findUploadUsage(publicPath);
    if (usage.current.length || usage.history.length) return { usage };
  }

  await storage().remove(key);
  return { ok: true };
}

/** The member twin of presignVideoUpload. Same shape, same shared rules; what
 *  makes this the member door is the gate plus the prefix — the key is minted
 *  under `members/<id>/`, so `dir` can only ever choose a subfolder of the
 *  caller's own namespace and there is no field in which a client could name
 *  someone else's. */
export async function presignMemberVideoUpload(input: {
  dir: string;
  contentType: string;
  filename: string;
}): Promise<VideoUploadTicket> {
  const me = await requireMember();
  const t = makeUI(await getLocale());

  const plan = planVideoUpload(input, {
    keyPrefix: memberPrefix(me.id),
    messages: memberUploadMessages(t),
  });
  if ("error" in plan) return { error: plan.error };

  const url = await storage().presignPut(plan.key, `video/${plan.ext}`);
  if (!url) return { mode: "direct" };
  return { mode: "presigned", url, path: keyToPublicPath(plan.key) };
}

/** The member twin of saveVideoPoster — and, as there, the step that doubles as
 *  proof the clip actually landed: it head-checks the object before writing.
 *  Members had no equivalent before, because their poster was written inside
 *  storeUpload() while the app still saw the bytes. */
export async function saveMemberVideoPoster(fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  const me = await requireMember();
  const t = makeUI(await getLocale());

  const videoPath = String(fd.get("videoPath") || "");
  const key = /^\/uploads\/[\w./-]+\.(mp4|webm)$/i.test(videoPath) ? publicPathToKey(videoPath) : null;
  // Hard-scope, exactly as deleteMemberUpload does it: the key is already known
  // to be traversal-free, so the prefix test cannot be walked around.
  if (!key || !key.startsWith(`${memberPrefix(me.id)}/`)) return { error: t("media.errNoFile") };

  const store = storage();
  if (!(await store.head(key))) return { error: t("media.errNoFile") };

  const poster = fd.get("poster");
  if (!(poster instanceof File) || poster.size === 0) return { error: t("media.errNoFile") };
  if (poster.size > 2 * 1024 * 1024) return { error: t("media.errTooLargeServer", { limit: "2" }) };

  try {
    await store.put(`${key}.jpg`, Buffer.from(await poster.arrayBuffer()), {
      contentType: "image/jpeg",
    });
  } catch {
    return { error: t("media.loadError") };
  }
  return { ok: true };
}
