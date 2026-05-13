'use server';

import { createHash, randomBytes } from 'node:crypto';

import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import ResetPasswordEmail from '../../../../emails/ResetPasswordEmail';
import { prisma } from '@/lib/prisma';
import { tryEmailSend } from '@/lib/email';
import { consumeRateLimit } from '@/lib/rate-limit';

const RESET_TTL_MINUTES = 30;
const REQUEST_LIMIT = 5;
const REQUEST_WINDOW_MS = 60 * 60 * 1000; // 5 requests / hour / IP
const BCRYPT_ROUNDS = 12;

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
});

const resetSchema = z
  .object({
    token: z.string().min(20).max(128),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ForgotActionState = {
  ok: boolean;
  message?: string;
  formError?: string;
};

export type ResetActionState = {
  ok: boolean;
  fieldErrors?: Partial<Record<'password' | 'confirmPassword' | 'token', string>>;
  formError?: string;
  done?: boolean;
};

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function buildResetUrl(rawToken: string): string {
  const base =
    process.env.NEXTAUTH_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
  return `${base}/reset-password?token=${rawToken}`;
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() ?? 'unknown';
  return h.get('x-real-ip')?.trim() ?? 'unknown';
}

// ─── Request a reset link ──────────────────────────────────────────────────

export async function requestPasswordReset(
  _prev: ForgotActionState,
  formData: FormData
): Promise<ForgotActionState> {
  const parsed = requestSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { ok: false, formError: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const { email } = parsed.data;

  // Rate limit by IP — protect against enumeration scraping.
  const ip = await getClientIp();
  const rl = consumeRateLimit({
    key: `pwreset:${ip}`,
    limit: REQUEST_LIMIT,
    windowMs: REQUEST_WINDOW_MS,
  });
  if (!rl.allowed) {
    return {
      ok: false,
      formError: `Too many reset requests. Try again in ${Math.ceil(rl.retryAfterSeconds / 60)} min.`,
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond identically — never reveal whether email is registered.
  const successMessage =
    'If an account exists for that email, a reset link is on the way.';

  if (!user || !user.emailVerified) {
    return { ok: true, message: successMessage };
  }

  // Invalidate prior open tokens, issue a new one.
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  await tryEmailSend({
    userId: user.id,
    notification: {
      type: 'VERIFICATION_RESULT',
      title: 'Password reset link sent',
      body: `We sent a password reset link to ${email}.`,
    },
    to: email,
    subject: 'Reset your password',
    template: ResetPasswordEmail,
    data: {
      name: user.name,
      resetUrl: buildResetUrl(rawToken),
      expiresInMinutes: RESET_TTL_MINUTES,
    },
  });

  if (!process.env.RESEND_API_KEY) {
    // eslint-disable-next-line no-console
    console.info(`[forgot] reset URL for ${email}: ${buildResetUrl(rawToken)}`);
  }

  return { ok: true, message: successMessage };
}

// ─── Consume the reset link ────────────────────────────────────────────────

export async function resetPassword(
  _prev: ResetActionState,
  formData: FormData
): Promise<ResetActionState> {
  const parsed = resetSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    const fieldErrors: ResetActionState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<ResetActionState['fieldErrors']>;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.consumedAt || record.expiresAt < new Date()) {
    return {
      ok: false,
      formError:
        'This reset link is invalid or has expired. Request a new one from the forgot-password page.',
    };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    }),
  ]);

  return { ok: true, done: true };
}
