import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';

// Architecture ADR-005: file storage on Hostinger filesystem. Public assets
// (logos) live under public/uploads/logos/ for direct static serving via the
// Hostinger CDN. Private uploads (verification documents) land in
// storage/uploads/ which is served only through authorised API routes.

const PUBLIC_LOGO_DIR = path.join(process.cwd(), 'public', 'uploads', 'logos');

const ALLOWED_LOGO_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB per S-03.1 AC

function extensionFor(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
}

export interface SaveLogoResult {
  ok: boolean;
  path?: string;
  error?: string;
}

/**
 * Persist a company logo to public/uploads/logos/<companyId>.<ext>.
 * Returns the public URL (path relative to the site root). Existing files at
 * the same companyId path are overwritten by `writeFile`.
 */
export async function saveCompanyLogo(
  companyId: string,
  file: File
): Promise<SaveLogoResult> {
  if (file.size === 0) return { ok: true };
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, error: 'Logo must be 2 MB or smaller' };
  }
  if (!ALLOWED_LOGO_MIME.has(file.type)) {
    return { ok: false, error: 'Logo must be JPG, PNG, or WEBP' };
  }

  await mkdir(PUBLIC_LOGO_DIR, { recursive: true });

  const ext = extensionFor(file.type);
  const filename = `${companyId}.${ext}`;
  const absPath = path.join(PUBLIC_LOGO_DIR, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, bytes);

  return { ok: true, path: `/uploads/logos/${filename}` };
}

/** Best-effort delete of a logo file given its public URL. Silent on miss. */
export async function deleteCompanyLogo(publicUrl: string): Promise<void> {
  const filename = path.basename(publicUrl);
  const absPath = path.join(PUBLIC_LOGO_DIR, filename);
  try {
    await unlink(absPath);
  } catch {
    // Ignore — already gone, or never existed.
  }
}
