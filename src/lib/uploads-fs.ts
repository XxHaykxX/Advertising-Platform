// Server-only. Raw filesystem write for uploads, without the "use server"
// action boundary of src/lib/actions/uploads.ts (whose uploadImage() gates
// on requireUser() — staff only). Poster generation needs the *same*
// public/uploads/… on-disk convention from both a staff-only action
// (admin/(panel)/projects/poster-action.ts) and a member-only one
// (account/projects/poster-action.ts), so the auth gate has to live at each
// call site instead of here. Not exported as a server action itself — it's
// just a plain async helper, safe to import into either "use server" file.
import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/lib/uploads-dir";

const UPLOAD_ROOT = UPLOADS_DIR;
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Keep only a safe folder segment — strip anything that could escape the
   uploads root, same rule as uploadImage()'s safeSegment(). */
function safeSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 64) || "misc";
}

/** Writes a raw image buffer under public/uploads/{dir}/… and returns the
 *  public "/uploads/…" path (never a giant data URL — Project.poster is a
 *  plain VARCHAR column). */
export async function saveGeneratedImage(buffer: Buffer, mimeType: string, dir: string): Promise<string> {
  const ext = EXT_BY_TYPE[mimeType] || "jpg";
  const safeDir = safeSegment(dir);
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const destDir = path.join(UPLOAD_ROOT, safeDir);
  await mkdir(destDir, { recursive: true });
  await writeFile(path.join(destDir, name), buffer);
  return `/uploads/${safeDir}/${name}`;
}
