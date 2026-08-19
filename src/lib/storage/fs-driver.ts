// The driver the app has always had, now behind the interface: files under
// UPLOADS_DIR, served back by the Node route at app/uploads/[...path]/route.ts.
// This stays the default forever — it is what local dev uses, and what
// Hostinger keeps using until the DNS cutover.
import "server-only";
import { mkdir, writeFile, readFile, unlink, stat, readdir } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/lib/uploads-dir";
import { isSafeKey } from "./keys";
import type { PutOptions, StorageDriver, StoredFile } from "./types";

/** isSafeKey() is the fence; this is the check that catches the NEXT way
 *  somebody finds to smuggle a separator through it, instead of trusting one
 *  predicate forever. Kept from the code this driver replaces. */
function resolve(key: string): string | null {
  if (!isSafeKey(key)) return null;
  const abs = path.resolve(UPLOADS_DIR, key);
  if (abs !== UPLOADS_DIR && !abs.startsWith(UPLOADS_DIR + path.sep)) return null;
  return abs;
}

function rejected(key: string): never {
  // Loud rather than silent: an unsafe key reaching a driver means a caller
  // skipped publicPathToKey(), and writing it "somewhere safe" instead would
  // hide that.
  throw new Error(`Unsafe storage key: ${JSON.stringify(key)}`);
}

export const fsDriver: StorageDriver = {
  name: "fs",

  async put(key: string, body: Buffer, _opts?: PutOptions): Promise<void> {
    // contentType/contentDisposition are deliberately ignored here: on disk the
    // type is derived from the extension when the file is served, so there is
    // nowhere to store them and nothing that would read them back.
    const abs = resolve(key) ?? rejected(key);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, body);
  },

  async get(key: string): Promise<Buffer | null> {
    const abs = resolve(key) ?? rejected(key);
    try {
      return await readFile(abs);
    } catch {
      return null;
    }
  },

  async head(key: string): Promise<{ size: number } | null> {
    const abs = resolve(key) ?? rejected(key);
    try {
      const s = await stat(abs);
      return s.isFile() ? { size: s.size } : null;
    } catch {
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    const abs = resolve(key) ?? rejected(key);
    try {
      await unlink(abs);
    } catch {
      // already gone — success
    }
  },

  async list(prefix: string): Promise<StoredFile[]> {
    // "" means the whole tree (the staff media library); a member's library
    // passes "members/<id>".
    const root = prefix ? resolve(prefix) : UPLOADS_DIR;
    if (!root) rejected(prefix);

    const out: StoredFile[] = [];
    async function walk(abs: string, rel: string) {
      let entries;
      try {
        entries = await readdir(abs, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        const childAbs = path.join(abs, e.name);
        const childRel = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) {
          await walk(childAbs, childRel);
        } else {
          const s = await stat(childAbs);
          out.push({ key: childRel, size: s.size, mtime: s.mtimeMs });
        }
      }
    }
    await walk(root, prefix);
    return out.sort((a, b) => b.mtime - a.mtime);
  },

  publicUrl(): string | null {
    // The app serves these itself — see app/uploads/[...path]/route.ts.
    return null;
  },

  async presignPut(): Promise<string | null> {
    // A local directory has no URL to sign. Null tells the caller to post the
    // bytes through the app, which is what Hostinger has always done — and
    // keeping that path alive and unchanged is the first rule of the AWS move.
    return null;
  },
};
