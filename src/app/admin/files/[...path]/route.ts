import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { readPrivateFile } from '@/lib/storage';

// Admin-only streaming endpoint for private uploads (verification docs etc).
// The 2FA window is checked inline rather than via requireAdmin() because
// requireAdmin() *redirects* on failure — fine for pages, ugly inside <iframe>.
// Here we return JSON errors so a broken preview shows a status code instead
// of the login page rendered inside the iframe.
const MFA_WINDOW_MS = 60 * 60 * 1000;

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, twoFactorEnabled: true, mfaVerifiedAt: true },
  });
  if (!user || user.role !== 'ADMIN' || !user.twoFactorEnabled) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const verifiedAt = user.mfaVerifiedAt?.getTime() ?? 0;
  if (Date.now() - verifiedAt > MFA_WINDOW_MS) {
    return NextResponse.json({ error: 'mfa-expired' }, { status: 403 });
  }

  const relPath = (params.path ?? []).join('/');
  const file = await readPrivateFile(relPath);
  if (!file) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  return new NextResponse(file.buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': file.mimeType,
      'Content-Length': String(file.size),
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
