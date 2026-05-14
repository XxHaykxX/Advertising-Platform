'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { notifyVerificationDecision } from '@/lib/verification-notify';

export type DecisionState = {
  ok: boolean;
  formError?: string;
};

const ACTIONS = new Set(['approve', 'reject', 'needs_info']);

export async function decideVerification(
  _prev: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const admin = await requireAdmin();

  const verificationRequestId = String(formData.get('verificationRequestId') ?? '').trim();
  const action = String(formData.get('action') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();

  if (!verificationRequestId) {
    return { ok: false, formError: 'Missing verification request id.' };
  }
  if (!ACTIONS.has(action)) {
    return { ok: false, formError: 'Unknown action.' };
  }
  if ((action === 'reject' || action === 'needs_info') && reason.length < 5) {
    return {
      ok: false,
      formError:
        action === 'reject'
          ? 'Reason is required when rejecting — at least 5 characters.'
          : 'Tell the company what extra info you need — at least 5 characters.',
    };
  }

  const req = await prisma.verificationRequest.findUnique({
    where: { id: verificationRequestId },
    select: {
      id: true,
      decision: true,
      companyId: true,
      company: {
        select: {
          id: true,
          users: { select: { role: true } },
        },
      },
    },
  });
  if (!req) return { ok: false, formError: 'Verification request not found.' };
  if (req.decision) {
    return {
      ok: false,
      formError: 'This request has already been decided. Refresh to see the current state.',
    };
  }

  const decision =
    action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'NEEDS_INFO';

  const userRoles = new Set(req.company.users.map((u) => u.role));
  const isApproved = decision === 'APPROVED';
  const canAdvertise = isApproved && userRoles.has('ADVERTISER');
  const canPublish = isApproved && userRoles.has('PUBLISHER');

  await prisma.$transaction([
    prisma.verificationRequest.update({
      where: { id: req.id },
      data: {
        decision,
        decisionReason: decision === 'APPROVED' ? null : reason || null,
        reviewedAt: new Date(),
        reviewedByAdminId: admin.userId,
      },
    }),
    prisma.company.update({
      where: { id: req.companyId },
      data: {
        verificationStatus: decision,
        verifiedAt: isApproved ? new Date() : null,
        verifiedById: isApproved ? admin.userId : null,
        canAdvertise,
        canPublish,
      },
    }),
  ]);

  await notifyVerificationDecision({
    companyId: req.companyId,
    decision,
    reason: decision === 'APPROVED' ? null : reason || null,
  });

  revalidatePath('/admin/verifications');
  revalidatePath(`/admin/verifications/${req.id}`);
  revalidatePath('/admin');

  redirect('/admin/verifications');
}
