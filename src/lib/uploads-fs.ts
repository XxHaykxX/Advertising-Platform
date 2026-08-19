// Server-only. The upload write path without the "use server" action boundary
// of src/lib/actions/uploads.ts (whose uploadImage() gates on
// requireContentEditor() — staff only). Poster generation needs the *same*
// /uploads/… convention from both a staff-only action
// (admin/(panel)/projects/poster-action.ts) and a member-only one
// (account/projects/poster-action.ts), so the auth gate has to live at each
// call site instead of here. Not exported as a server action itself — it's
// just a plain async helper, safe to import into either "use server" file.
//
// The name is now a small lie: since the storage driver landed this writes
// through whichever backend is configured, not necessarily a filesystem.
import "server-only";
import { randomUUID } from "node:crypto";
import { optimizeImage, kindForDir } from "@/lib/images/optimize";
import { contentTypeForKey, joinKey, keyToPublicPath, safeSegment, storage } from "@/lib/storage";

/** Writes an AI-generated image buffer under uploads/{dir}/… and returns the
 *  public "/uploads/…" path (never a giant data URL — Project.poster is a
 *  plain VARCHAR column). The buffer is resized + recompressed to the dir's
 *  target (posters → 16:9) exactly like a manual upload. `mimeType` is kept
 *  for signature compatibility but the output format is decided by the
 *  optimizer.
 *
 *  `safeSegment` used to be a local copy here, and a weaker one — it was
 *  missing the dots-only check that the copy in uploads-store.ts gained on
 *  2026-07-30, so this door would have accepted `dir=".."`. Both callers pass
 *  the literal "projects", so nothing was ever reachable through it; the point
 *  is that a second copy of a security rule is how the *next* caller ends up on
 *  the wrong side of it. There is one copy now, in src/lib/storage/keys.ts. */
export async function saveGeneratedImage(buffer: Buffer, _mimeType: string, dir: string): Promise<string> {
  const safeDir = safeSegment(dir);
  const optimized = await optimizeImage(buffer, kindForDir(safeDir));
  const key = joinKey(safeDir, `${Date.now()}-${randomUUID().slice(0, 8)}.${optimized.ext}`);
  await storage().put(key, optimized.buffer, { contentType: contentTypeForKey(key) });
  return keyToPublicPath(key);
}
