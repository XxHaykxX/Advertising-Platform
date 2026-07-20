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
import { optimizeImage, kindForDir } from "@/lib/images/optimize";

const UPLOAD_ROOT = UPLOADS_DIR;

/** Keep only a safe folder segment — strip anything that could escape the
   uploads root, same rule as uploadImage()'s safeSegment(). */
function safeSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 64) || "misc";
}

/** Writes an AI-generated image buffer under uploads/{dir}/… and returns the
 *  public "/uploads/…" path (never a giant data URL — Project.poster is a
 *  plain VARCHAR column). The buffer is resized + recompressed to the dir's
 *  target (posters → 16:10) exactly like a manual upload. `mimeType` is kept
 *  for signature compatibility but the output format is decided by the
 *  optimizer. */
export async function saveGeneratedImage(buffer: Buffer, _mimeType: string, dir: string): Promise<string> {
  const safeDir = safeSegment(dir);
  const optimized = await optimizeImage(buffer, kindForDir(safeDir));
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${optimized.ext}`;
  const destDir = path.join(UPLOAD_ROOT, safeDir);
  await mkdir(destDir, { recursive: true });
  await writeFile(path.join(destDir, name), optimized.buffer);
  return `/uploads/${safeDir}/${name}`;
}
