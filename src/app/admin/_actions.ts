'use server';

import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Logout from the admin console. Wipes mfaVerifiedAt so the next admin
 * login restarts the 2FA gate even if the cookie session lingers on a
 * shared machine.
 */
export async function signOutAdmin() {
  const session = await auth();
  if (session?.user?.id) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { mfaVerifiedAt: null },
    });
  }
  await signOut({ redirectTo: '/admin/login' });
}
