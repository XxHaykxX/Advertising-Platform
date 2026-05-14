import { randomBytes } from 'node:crypto';
import { mkdir, readFile, stat, writeFile, unlink } from 'node:fs/promises';
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

// ─── Private uploads ────────────────────────────────────────────────────────
// Verification documents and other admin-only files live OUTSIDE public/ so
// they cannot be served by the static handler. An auth-checked Next.js route
// will stream them for admins in S-03.5; for now we just persist them.

const PRIVATE_ROOT = path.join(process.cwd(), 'storage', 'uploads');

const ALLOWED_DOC_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB per S-03.2 AC

function docExtensionFor(mime: string): string {
  switch (mime) {
    case 'application/pdf':
      return 'pdf';
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

export interface SavedDocument {
  path: string;
  mimeType: string;
  originalName: string;
  size: number;
}

export interface SaveVerificationDocsResult {
  ok: boolean;
  documents: SavedDocument[];
  error?: string;
}

/**
 * Persist verification documents under storage/uploads/companies/<companyId>/verification/.
 * Caller is responsible for storing the returned descriptors on VerificationRequest.documents.
 */
export async function saveVerificationDocs(
  companyId: string,
  files: File[]
): Promise<SaveVerificationDocsResult> {
  if (files.length === 0) return { ok: true, documents: [] };
  if (files.length > 5) {
    return { ok: false, documents: [], error: 'Upload up to 5 documents at a time' };
  }

  const dir = path.join(PRIVATE_ROOT, 'companies', companyId, 'verification');
  await mkdir(dir, { recursive: true });

  const saved: SavedDocument[] = [];
  for (const file of files) {
    if (file.size === 0) continue;
    if (file.size > MAX_DOC_BYTES) {
      return {
        ok: false,
        documents: saved,
        error: `${file.name}: exceeds the 10 MB limit`,
      };
    }
    if (!ALLOWED_DOC_MIME.has(file.type)) {
      return {
        ok: false,
        documents: saved,
        error: `${file.name}: only PDF / JPG / PNG / WEBP allowed`,
      };
    }
    const random = randomBytes(12).toString('hex');
    const ext = docExtensionFor(file.type);
    const filename = `${random}.${ext}`;
    const absPath = path.join(dir, filename);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(absPath, bytes);

    saved.push({
      path: `companies/${companyId}/verification/${filename}`,
      mimeType: file.type,
      originalName: file.name,
      size: file.size,
    });
  }

  return { ok: true, documents: saved };
}

const PRIVATE_FILE_MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export interface PrivateFile {
  buffer: Buffer;
  mimeType: string;
  size: number;
}

/**
 * Read a private upload by its relative path (e.g.
 * "companies/<id>/verification/<random>.pdf"). Returns null when the file is
 * missing OR when the path attempts to escape PRIVATE_ROOT. The caller MUST
 * already have established authorisation (admin-only route).
 */
export async function readPrivateFile(relPath: string): Promise<PrivateFile | null> {
  // Reject path traversal. Joining + comparing prefix beats checking
  // substrings because Windows uses backslashes and normalize() collapses
  // mixed separators.
  const safeRel = relPath.replace(/^[/\\]+/, '');
  const abs = path.normalize(path.join(PRIVATE_ROOT, safeRel));
  const rootWithSep = PRIVATE_ROOT.endsWith(path.sep) ? PRIVATE_ROOT : PRIVATE_ROOT + path.sep;
  if (!abs.startsWith(rootWithSep)) return null;

  try {
    const fileStat = await stat(abs);
    if (!fileStat.isFile()) return null;
    const buffer = await readFile(abs);
    const ext = path.extname(abs).slice(1).toLowerCase();
    const mimeType = PRIVATE_FILE_MIME_BY_EXT[ext] ?? 'application/octet-stream';
    return { buffer, mimeType, size: fileStat.size };
  } catch {
    return null;
  }
}
