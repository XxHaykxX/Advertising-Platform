'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { AdminSubrole } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';

const BCRYPT_ROUNDS = 12;

const createSchema = z.object({
  email: z.string().trim().toLowerCase().email('Valid email please'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .max(200, 'Password too long'),
  subrole: z.enum(['OWNER', 'MANAGER', 'BROKER', 'SUPPORT']),
});

export type CreateAdminState = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Partial<Record<'email' | 'name' | 'password' | 'subrole', string>>;
  successFlash?: string;
};

export async function createAdminUser(
  _prev: CreateAdminState,
  formData: FormData
): Promise<CreateAdminState> {
  await requireAdmin();

  const parsed = createSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
    password: formData.get('password'),
    subrole: formData.get('subrole'),
  });
  if (!parsed.success) {
    const fieldErrors: CreateAdminState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<CreateAdminState['fieldErrors']>;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const { email, name, password, subrole } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
  if (existing) {
    return {
      ok: false,
      formError: `${email} already exists. Use the row actions to change role / reset password.`,
    };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: 'ADMIN',
      adminSubrole: subrole,
      emailVerified: new Date(),
    },
  });

  revalidatePath('/admin/team');
  return {
    ok: true,
    successFlash: `Invited ${email} as ${subrole}. They enrol TOTP on first login.`,
  };
}

const subroleSchema = z.enum(['OWNER', 'MANAGER', 'BROKER', 'SUPPORT']);

export async function changeAdminSubrole(formData: FormData): Promise<void> {
  await requireAdmin();

  const userId = String(formData.get('userId') ?? '').trim();
  const next = String(formData.get('subrole') ?? '').trim();
  if (!userId) return;
  const parsed = subroleSchema.safeParse(next);
  if (!parsed.success) return;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, adminSubrole: true },
  });
  if (!target || target.role !== 'ADMIN') return;
  if (target.adminSubrole === parsed.data) return;

  await prisma.user.update({
    where: { id: userId },
    data: { adminSubrole: parsed.data as AdminSubrole },
  });
  revalidatePath('/admin/team');
}

export async function resetAdminMfaState(formData: FormData): Promise<void> {
  await requireAdmin();

  const userId = String(formData.get('userId') ?? '').trim();
  if (!userId) return;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!target || target.role !== 'ADMIN') return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      mfaVerifiedAt: null,
    },
  });
  revalidatePath('/admin/team');
}

export async function resetAdminPassword(formData: FormData): Promise<CreateAdminState> {
  await requireAdmin();

  const userId = String(formData.get('userId') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!userId) return { ok: false, formError: 'Missing user.' };
  if (password.length < 10) {
    return { ok: false, formError: 'Password must be at least 10 characters.' };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!target || target.role !== 'ADMIN') {
    return { ok: false, formError: 'Target is not an admin.' };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: target.id },
    data: {
      passwordHash,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      mfaVerifiedAt: null,
    },
  });
  revalidatePath('/admin/team');
  return {
    ok: true,
    successFlash: `Reset password for ${target.email}. 2FA cleared — they re-enrol on next login.`,
  };
}

