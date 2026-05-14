'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { recordAudit } from '@/lib/audit';
import {
  allowedInquiryTransitions,
  type InquiryStatusInput,
} from '@/lib/validation/inquiry';

const TERMINAL_STATES: ReadonlySet<InquiryStatusInput> = new Set([
  'CONFIRMED',
  'LOST',
  'CANCELLED',
]);

const ACTION_FOR_STATUS: Record<'CONFIRMED' | 'LOST' | 'CANCELLED', string> = {
  CONFIRMED: 'ADMIN_CONFIRMED',
  LOST: 'ADMIN_LOST',
  CANCELLED: 'ADMIN_CANCELLED',
};

export type CloseState = {
  ok: boolean;
  formError?: string;
};

export async function closeInquiry(
  _prev: CloseState,
  formData: FormData
): Promise<CloseState> {
  const admin = await requireAdmin();

  const inquiryId = String(formData.get('inquiryId') ?? '').trim();
  const target = String(formData.get('target') ?? '').trim() as InquiryStatusInput;
  const reason = String(formData.get('reason') ?? '').trim();

  if (!inquiryId) return { ok: false, formError: 'Missing inquiry id.' };
  if (!TERMINAL_STATES.has(target)) {
    return { ok: false, formError: 'Unsupported close state.' };
  }
  // Per S-09.7 AC: Lost / Cancelled require a reason; Confirmed is optional.
  if ((target === 'LOST' || target === 'CANCELLED') && reason.length < 5) {
    return {
      ok: false,
      formError:
        target === 'LOST'
          ? 'Why did we lose this one? At least 5 characters.'
          : 'A short note on why it was cancelled. At least 5 characters.',
    };
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { id: true, status: true },
  });
  if (!inquiry) return { ok: false, formError: 'Inquiry not found.' };
  if (!allowedInquiryTransitions[inquiry.status].includes(target)) {
    return {
      ok: false,
      formError: `Cannot close a ${inquiry.status.toLowerCase().replace('_', ' ')} inquiry as ${target.toLowerCase()}.`,
    };
  }

  await prisma.$transaction([
    prisma.inquiry.update({
      where: { id: inquiry.id },
      data: {
        status: target,
        closedAt: new Date(),
        closeReason: reason || null,
      },
    }),
    prisma.inquiryAuditEntry.create({
      data: {
        inquiryId: inquiry.id,
        actorUserId: admin.userId,
        fromStatus: inquiry.status,
        toStatus: target,
        action: ACTION_FOR_STATUS[target as 'CONFIRMED' | 'LOST' | 'CANCELLED'],
        note: reason || null,
      },
    }),
  ]);

  await recordAudit({
    actorUserId: admin.userId,
    action: `INQUIRY_${target}`,
    entityType: 'INQUIRY',
    entityId: inquiry.id,
    before: { status: inquiry.status },
    after: { status: target, reason: reason || null },
  });

  revalidatePath('/admin/inquiries');
  revalidatePath(`/admin/inquiries/${inquiry.id}`);

  redirect('/admin/inquiries');
}
