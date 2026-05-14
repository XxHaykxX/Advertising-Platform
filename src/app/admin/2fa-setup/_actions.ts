'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { encryptSecret } from '@/lib/totp-crypto';
import { verifyCode } from '@/lib/totp';

const schema = z.object({
  secret: z.string().min(16, 'Setup token missing — start over'),
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export type EnrollActionState = {
  ok: boolean;
  formError?: string;
};

export async function confirmEnrollment(
  _prev: EnrollActionState,
  formData: FormData
): Promise<EnrollActionState> {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, twoFactorEnabled: true },
  });
  if (!user || user.role !== 'ADMIN') redirect('/admin/login');
  if (user.twoFactorEnabled) redirect('/admin/2fa');

  const parsed = schema.safeParse({
    secret: formData.get('secret'),
    code: formData.get('code'),
  });
  if (!parsed.success) {
    return { ok: false, formError: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const { secret, code } = parsed.data;

  if (!verifyCode(secret, code)) {
    return {
      ok: false,
      formError: 'Code did not match. Make sure your authenticator clock is in sync, then try again.',
    };
  }

  const encrypted = encryptSecret(secret);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: encrypted,
      mfaVerifiedAt: new Date(),
    },
  });

  redirect('/admin');
}
