'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const BCRYPT_ROUNDS = 12;

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'Password is too long'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'New password must be different from the current one',
    path: ['newPassword'],
  });

export type ChangePasswordActionState = {
  ok: boolean;
  fieldErrors?: Partial<
    Record<'currentPassword' | 'newPassword' | 'confirmPassword', string>
  >;
  formError?: string;
  done?: boolean;
};

export async function changePassword(
  _prev: ChangePasswordActionState,
  formData: FormData
): Promise<ChangePasswordActionState> {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const parsed = schema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    const fieldErrors: ChangePasswordActionState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<
        ChangePasswordActionState['fieldErrors']
      >;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });
  if (!user) redirect('/login');

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    return {
      ok: false,
      fieldErrors: { currentPassword: 'Current password is wrong.' },
    };
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Invalidate any open password-reset tokens — if someone had requested a
  // reset they shouldn't be able to use it after the user has self-rotated.
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  return { ok: true, done: true };
}
