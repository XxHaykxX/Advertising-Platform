'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { z } from 'zod';

import { signIn } from '@/auth';
import { prisma } from '@/lib/prisma';
import { consumeRateLimit, resetRateLimit } from '@/lib/rate-limit';

const LOGIN_RATE_LIMIT = 10;
const LOGIN_WINDOW_MS = 5 * 60 * 1000; // 5 minutes — NFR-014.

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginActionState = {
  ok: boolean;
  formError?: string;
  unverifiedEmail?: string;
  retryAfterSeconds?: number;
};

async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() ?? 'unknown';
  return h.get('x-real-ip')?.trim() ?? 'unknown';
}

export async function login(
  _prev: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  // 1. Parse
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { ok: false, formError: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const { email, password } = parsed.data;

  // 2. Rate limit per IP — NFR-014: 10 failed attempts / 5 min / IP.
  const ip = await getClientIp();
  const rl = consumeRateLimit({
    key: `login:${ip}`,
    limit: LOGIN_RATE_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
  });
  if (!rl.allowed) {
    return {
      ok: false,
      formError: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} min.`,
      retryAfterSeconds: rl.retryAfterSeconds,
    };
  }

  // 3. Pre-flight emailVerified check — surfaces a clear "please verify"
  //    message instead of the generic credentials error. We accept the mild
  //    enumeration leak (email exists) in exchange for substantially better UX.
  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true, role: true, companyId: true },
  });
  if (user && !user.emailVerified) {
    return {
      ok: false,
      formError: 'Please verify your email before logging in.',
      unverifiedEmail: email,
    };
  }

  // 4. Delegate to NextAuth Credentials provider. `redirect: false` so we can
  //    surface field errors here; we then redirect ourselves based on role.
  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      // CredentialsSignin — generic message (no enumeration of email vs password).
      return { ok: false, formError: 'Email or password is wrong.' };
    }
    throw err;
  }

  // Successful login — clear the failure counter for this IP.
  resetRateLimit(`login:${ip}`);

  // 5. Redirect by onboarding stage:
  //    - Admins go straight to /admin (no company profile required).
  //    - New users without a Company row land on /company-profile (S-03.1).
  //    - Everyone else hits the dashboard.
  if (user?.role === 'ADMIN') redirect('/admin');
  if (!user?.companyId) redirect('/company-profile');
  redirect('/dashboard');
}
