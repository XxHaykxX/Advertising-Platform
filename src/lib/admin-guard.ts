import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// 1-hour sliding window for the 2FA grace per S-08.2. Each admin page hit
// refreshes mfaVerifiedAt so an active session stays unlocked but an idle
// terminal locks itself within an hour.
const MFA_WINDOW_MS = 60 * 60 * 1000;

// Dev-only escape hatch: setting DISABLE_ADMIN_2FA=true in .env skips the
// TOTP enrolment + verification gate entirely. Gated on NODE_ENV so even an
// accidental prod value is ignored (defense in depth — prod env should
// never contain this var anyway).
export const adminMfaDisabled =
  process.env.NODE_ENV !== 'production' &&
  process.env.DISABLE_ADMIN_2FA === 'true';

if (adminMfaDisabled) {
  console.warn(
    '[admin-guard] DISABLE_ADMIN_2FA=true — 2FA gate is OFF. Dev use only.'
  );
}

export type AdminGuardResult = {
  userId: string;
  name: string;
  email: string;
};

/**
 * Server-side guard for every /admin/* page (except the auth screens).
 * Validates:
 *   1. There is an authenticated session.
 *   2. The user's role is ADMIN.
 *   3. The user has completed 2FA setup (twoFactorEnabled = true).
 *   4. The 2FA verification timestamp is within the last hour.
 * Redirects appropriately on each failure mode and refreshes mfaVerifiedAt
 * on success for the sliding-window idle timeout.
 */
export async function requireAdmin(): Promise<AdminGuardResult> {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      twoFactorEnabled: true,
      mfaVerifiedAt: true,
    },
  });

  if (!user) redirect('/admin/login');
  if (user.role !== 'ADMIN') redirect('/dashboard');

  if (!adminMfaDisabled) {
    if (!user.twoFactorEnabled) redirect('/admin/2fa-setup');

    const verifiedAt = user.mfaVerifiedAt?.getTime() ?? 0;
    if (Date.now() - verifiedAt > MFA_WINDOW_MS) {
      redirect('/admin/2fa');
    }

    // Slide the window so an active admin doesn't get logged out mid-flow.
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaVerifiedAt: new Date() },
    });
  }

  return { userId: user.id, name: user.name, email: user.email };
}
