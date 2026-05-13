'use server';

import { randomInt } from 'node:crypto';

import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';
import { ZodError } from 'zod';

import VerifyEmail from '../../../../emails/VerifyEmail';
import { prisma } from '@/lib/prisma';
import { tryEmailSend } from '@/lib/email';
import { registerSchema } from '@/lib/validation/register';

const BCRYPT_ROUNDS = 12;
const VERIFICATION_TTL_MINUTES = 10;

export type RegisterActionState = {
  ok: boolean;
  fieldErrors?: Partial<Record<'name' | 'email' | 'phone' | 'password' | 'acceptTerms' | 'role', string>>;
  formError?: string;
};

function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export async function registerUser(
  _prev: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  // 1. Parse + validate
  const raw = {
    role: formData.get('role'),
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    password: formData.get('password'),
    acceptTerms: formData.get('acceptTerms') === 'on',
  };

  let input;
  try {
    input = registerSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      const fieldErrors: RegisterActionState['fieldErrors'] = {};
      for (const issue of err.issues) {
        const key = issue.path[0] as keyof NonNullable<RegisterActionState['fieldErrors']>;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return { ok: false, fieldErrors };
    }
    return { ok: false, formError: 'Something went wrong. Please try again.' };
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  // 3. Create User + VerificationToken atomically. Catch P2002 → email conflict.
  const code = generateCode();
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MINUTES * 60 * 1000);

  let userId: string;
  try {
    const { user } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          name: input.name,
          phone: input.phone,
          passwordHash,
          role: input.role === 'advertiser' ? 'ADVERTISER' : 'PUBLISHER',
        },
      });
      await tx.verificationToken.create({
        data: { userId: user.id, code, expiresAt },
      });
      return { user };
    });
    userId = user.id;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return {
        ok: false,
        fieldErrors: {
          email: 'An account with this email already exists. Try logging in.',
        },
      };
    }
    return { ok: false, formError: 'We could not create your account. Please try again.' };
  }

  // 4. Fire the verification email (failures are logged to Sentry, never throw).
  await tryEmailSend({
    userId,
    notification: {
      type: 'VERIFICATION_RESULT',
      title: 'Verify your email',
      body: `We sent a 6-digit code to ${input.email}.`,
    },
    to: input.email,
    subject: 'Your verification code',
    template: VerifyEmail,
    data: {
      name: input.name,
      code,
      expiresInMinutes: VERIFICATION_TTL_MINUTES,
    },
  });

  // Dev convenience: surface the code in server logs when Resend is not configured.
  if (!process.env.RESEND_API_KEY) {
    // eslint-disable-next-line no-console
    console.info(`[register] verification code for ${input.email}: ${code}`);
  }

  // 5. Redirect to the verify page. `redirect()` throws a framework error
  //    that Next catches and converts to a client navigation.
  redirect(`/verify?email=${encodeURIComponent(input.email)}`);
}
