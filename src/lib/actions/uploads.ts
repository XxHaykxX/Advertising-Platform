"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { requireUser } from "@/lib/auth/require";

// All uploads live under public/uploads and are served as /uploads/… by Next's
// static handler. On Hostinger the Node process is long-lived, so files written
// at runtime persist on disk (unlike serverless).
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
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
  await requireUser();

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided." };
  if (file.size > MAX_BYTES) return { error: "File too large (max 8 MB)." };
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) return { error: "Unsupported type — use JPG, PNG, WebP, GIF or AVIF." };

  const dir = safeSegment(String(fd.get("dir") || "misc"));
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const destDir = path.join(UPLOAD_ROOT, dir);
  await mkdir(destDir, { recursive: true });
  await writeFile(path.join(destDir, name), Buffer.from(await file.arrayBuffer()));

  return { path: `/uploads/${dir}/${name}` };
}

export async function deleteUpload(publicPath: string): Promise<{ ok?: boolean; error?: string }> {
  await requireUser();
  const abs = resolveInsideUploads(publicPath);
  if (!abs) return { error: "Invalid path." };
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
  await requireUser();
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
