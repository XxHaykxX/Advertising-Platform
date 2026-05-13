'use server';

import { randomInt } from 'node:crypto';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import VerifyEmail from '../../../../emails/VerifyEmail';
import { prisma } from '@/lib/prisma';
import { tryEmailSend } from '@/lib/email';

const VERIFICATION_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

const verifySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

const resendSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export type VerifyActionState = {
  ok: boolean;
  error?: string;
};

export type ResendActionState = {
  ok: boolean;
  cooldownSecondsRemaining?: number;
  message?: string;
};

function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export async function verifyCode(
  _prev: VerifyActionState,
  formData: FormData
): Promise<VerifyActionState> {
  const parsed = verifySchema.safeParse({
    email: formData.get('email'),
    code: formData.get('code'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const { email, code } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Generic message — don't reveal whether email is registered.
    return { ok: false, error: 'Invalid code. Try requesting a new one.' };
  }
  if (user.emailVerified) {
    redirect('/login?verified=1');
  }

  const token = await prisma.verificationToken.findFirst({
    where: { userId: user.id, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!token) {
    return { ok: false, error: 'No active code. Request a new one.' };
  }
  if (token.expiresAt < new Date()) {
    return { ok: false, error: 'Code expired. Request a new one.' };
  }
  if (token.code !== code) {
    return { ok: false, error: 'Invalid code. Check the digits and try again.' };
  }

  await prisma.$transaction([
    prisma.verificationToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
  ]);

  redirect('/login?verified=1');
}

export async function resendVerification(
  _prev: ResendActionState,
  formData: FormData
): Promise<ResendActionState> {
  const parsed = resendSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { ok: false, message: 'Invalid email.' };
  }
  const email = parsed.data.email;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Generic OK — don't reveal whether email is registered.
    return { ok: true, message: 'If an account exists, a new code is on its way.' };
  }
  if (user.emailVerified) {
    return { ok: true, message: 'This email is already verified.' };
  }

  // Cooldown — based on the most recent token's createdAt.
  const latest = await prisma.verificationToken.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  if (latest) {
    const elapsed = (Date.now() - latest.createdAt.getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      return {
        ok: false,
        cooldownSecondsRemaining: Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed),
        message: `Please wait ${Math.ceil(
          RESEND_COOLDOWN_SECONDS - elapsed
        )}s before requesting another code.`,
      };
    }
  }

  // Invalidate any older active tokens (defensive — only newest is canonical).
  await prisma.verificationToken.updateMany({
    where: { userId: user.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MINUTES * 60 * 1000);
  await prisma.verificationToken.create({
    data: { userId: user.id, code, expiresAt },
  });

  await tryEmailSend({
    userId: user.id,
    notification: {
      type: 'VERIFICATION_RESULT',
      title: 'New verification code',
      body: `We sent a fresh 6-digit code to ${email}.`,
    },
    to: email,
    subject: 'Your verification code',
    template: VerifyEmail,
    data: {
      name: user.name,
      code,
      expiresInMinutes: VERIFICATION_TTL_MINUTES,
    },
  });

  if (!process.env.RESEND_API_KEY) {
    // eslint-disable-next-line no-console
    console.info(`[resend] verification code for ${email}: ${code}`);
  }

  return { ok: true, message: 'A new code is on its way.' };
}
