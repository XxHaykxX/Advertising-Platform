'use server';

import { randomBytes, createHash } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { recordAudit } from '@/lib/audit';
import { tryEmailSend } from '@/lib/email';
import ResetPasswordEmail from '../../../../emails/ResetPasswordEmail';

const APP_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

const suspendSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().trim().min(5, 'Reason ≥5 chars').max(2000),
});

export async function suspendUser(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const parsed = suspendSchema.safeParse({
    userId: formData.get('userId'),
    reason: formData.get('reason'),
  });
  if (!parsed.success) return;

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true, suspended: true },
  });
  if (!target) return;
  // Don't allow suspending admins via this surface (use admin team page instead).
  if (target.role === 'ADMIN') return;
  if (target.suspended) return;
  // Self-protection — can't suspend yourself even if you fudge the form id.
  if (target.id === me.userId) return;

  await prisma.user.update({
    where: { id: target.id },
    data: {
      suspended: true,
      suspendedAt: new Date(),
      suspendReason: parsed.data.reason,
    },
  });
  await recordAudit({
    actorUserId: me.userId,
    action: 'USER_SUSPENDED',
    entityType: 'USER',
    entityId: target.id,
    after: { reason: parsed.data.reason },
  });
  revalidatePath('/admin/users');
}

export async function unsuspendUser(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const userId = String(formData.get('userId') ?? '').trim();
  if (!userId) return;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, suspended: true },
  });
  if (!target || target.role === 'ADMIN' || !target.suspended) return;

  await prisma.user.update({
    where: { id: target.id },
    data: { suspended: false, suspendedAt: null, suspendReason: null },
  });
  await recordAudit({
    actorUserId: me.userId,
    action: 'USER_UNSUSPENDED',
    entityType: 'USER',
    entityId: target.id,
  });
  revalidatePath('/admin/users');
}

/**
 * Generate a one-time password-reset token and email the link to the user.
 * Uses the same PasswordResetToken model as the public /forgot-password
 * flow — the existing /reset-password page accepts both.
 */
export async function sendPasswordReset(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const userId = String(formData.get('userId') ?? '').trim();
  if (!userId) return;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true, name: true },
  });
  if (!target) return;
  // Admins reset their own passwords through /admin/team — keep the surfaces separate.
  if (target.role === 'ADMIN') return;

  const raw = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await prisma.passwordResetToken.create({
    data: {
      userId: target.id,
      tokenHash,
      expiresAt,
    },
  });

  await tryEmailSend({
    userId: target.id,
    notification: {
      type: 'VERIFICATION_RESULT',
      title: 'Password reset requested',
      body: 'The platform team initiated a password reset on your behalf.',
      link: `/reset-password?token=${raw}`,
    },
    to: target.email,
    subject: 'Reset your Advertising Platform password',
    template: ResetPasswordEmail,
    data: {
      name: target.name,
      resetUrl: `${APP_URL}/reset-password?token=${raw}`,
      expiresInMinutes: 60,
    },
  });

  await recordAudit({
    actorUserId: me.userId,
    action: 'USER_PASSWORD_RESET_INITIATED',
    entityType: 'USER',
    entityId: target.id,
  });
  revalidatePath('/admin/users');
}
