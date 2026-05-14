'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { z } from 'zod';

import { signIn } from '@/auth';
import { prisma } from '@/lib/prisma';
import { consumeRateLimit, resetRateLimit } from '@/lib/rate-limit';

const LOGIN_RATE_LIMIT = 10;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export type AdminLoginActionState = {
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

export async function adminLogin(
  _prev: AdminLoginActionState,
  formData: FormData
): Promise<AdminLoginActionState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { ok: false, formError: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const { email, password } = parsed.data;

  const ip = await getClientIp();
  const rl = consumeRateLimit({
    key: `admin-login:${ip}`,
    limit: LOGIN_RATE_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
  });
  if (!rl.allowed) {
    return {
      ok: false,
      formError: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} min.`,
    };
  }

  // Pre-flight checks: user must exist, have ADMIN role, and have a verified
  // email. We surface a generic "wrong credentials" message regardless to
  // avoid revealing whether an account is admin-grade.
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, emailVerified: true, twoFactorEnabled: true },
  });
  if (!user || user.role !== 'ADMIN' || !user.emailVerified) {
    return { ok: false, formError: 'Email or password is wrong.' };
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, formError: 'Email or password is wrong.' };
    }
    throw err;
  }

  resetRateLimit(`admin-login:${ip}`);

  // First-ever admin login → forced enrollment. Otherwise → 2FA challenge.
  // mfaVerifiedAt is *not* set yet; requireAdmin() will gate /admin pages.
  redirect(user.twoFactorEnabled ? '/admin/2fa' : '/admin/2fa-setup');
}
