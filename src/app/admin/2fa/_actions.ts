'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { consumeRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { decryptSecret } from '@/lib/totp-crypto';
import { verifyCode } from '@/lib/totp';

const schema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

const MFA_RATE_LIMIT = 5;
const MFA_WINDOW_MS = 5 * 60 * 1000;

export type VerifyActionState = {
  ok: boolean;
  formError?: string;
};

async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip')?.trim() ??
    'unknown'
  );
}

export async function verifyMfa(
  _prev: VerifyActionState,
  formData: FormData
): Promise<VerifyActionState> {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
    },
  });
  if (!user || user.role !== 'ADMIN') redirect('/admin/login');
  if (!user.twoFactorEnabled || !user.twoFactorSecret) redirect('/admin/2fa-setup');

  const ip = await getClientIp();
  const rl = consumeRateLimit({
    key: `admin-mfa:${ip}`,
    limit: MFA_RATE_LIMIT,
    windowMs: MFA_WINDOW_MS,
  });
  if (!rl.allowed) {
    return {
      ok: false,
      formError: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} min.`,
    };
  }

  const parsed = schema.safeParse({ code: formData.get('code') });
  if (!parsed.success) {
    return { ok: false, formError: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const secret = decryptSecret(user.twoFactorSecret);
  if (!verifyCode(secret, parsed.data.code)) {
    return { ok: false, formError: 'Code did not match. Try again.' };
  }

  resetRateLimit(`admin-mfa:${ip}`);

  await prisma.user.update({
    where: { id: user.id },
    data: { mfaVerifiedAt: new Date() },
  });

  redirect('/admin');
}
