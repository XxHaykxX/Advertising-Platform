'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import {
  allowedInquiryTransitions,
  type InquiryStatusInput,
} from '@/lib/validation/inquiry';

const STATUS_VALUES = new Set<InquiryStatusInput>([
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'AWAITING_PUBLISHER',
  'AWAITING_ADVERTISER',
  'CONFIRMED',
  'LOST',
  'CANCELLED',
]);

const STATUS_TO_AUDIT_ACTION: Record<InquiryStatusInput, string> = {
  NEW: 'ADMIN_REOPEN',
  ASSIGNED: 'ADMIN_ASSIGN',
  IN_PROGRESS: 'ADMIN_PROGRESS',
  AWAITING_PUBLISHER: 'ADMIN_AWAIT_PUBLISHER',
  AWAITING_ADVERTISER: 'ADMIN_AWAIT_ADVERTISER',
  CONFIRMED: 'ADMIN_CONFIRMED',
  LOST: 'ADMIN_LOST',
  CANCELLED: 'ADMIN_CANCELLED',
};

const CLOSED_STATES: InquiryStatusInput[] = ['CONFIRMED', 'LOST', 'CANCELLED'];

/**
 * Inline server action invoked from /admin/inquiries row controls. Reassigns
 * the inquiry to a specific admin OR clears assignment ("unassigned"). Always
 * writes an InquiryAuditEntry. Idempotent on no-op reassignments.
 */
export async function reassignInquiry(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const inquiryId = String(formData.get('inquiryId') ?? '').trim();
  const rawTarget = String(formData.get('assignedAdminId') ?? '').trim();
  if (!inquiryId) return;

  const targetId = rawTarget === '' || rawTarget === 'unassigned' ? null : rawTarget;

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { id: true, status: true, assignedAdminId: true },
  });
  if (!inquiry) return;
  if (inquiry.assignedAdminId === targetId) return;

  if (targetId) {
    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { role: true },
    });
    if (!target || target.role !== 'ADMIN') return;
  }

  await prisma.$transaction([
    prisma.inquiry.update({
      where: { id: inquiry.id },
      data: { assignedAdminId: targetId },
    }),
    prisma.inquiryAuditEntry.create({
      data: {
        inquiryId: inquiry.id,
        actorUserId: admin.userId,
        action: targetId ? 'ADMIN_REASSIGN' : 'ADMIN_UNASSIGN',
        note: targetId ? `→ ${targetId}` : null,
      },
    }),
  ]);

  revalidatePath('/admin/inquiries');
}

/**
 * Inline status change from the queue. Validated against the state machine
 * in src/lib/validation/inquiry.ts. Sets closedAt for terminal states. Always
 * writes an InquiryAuditEntry capturing the from→to transition.
 */
export async function changeInquiryStatus(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const inquiryId = String(formData.get('inquiryId') ?? '').trim();
  const next = String(formData.get('status') ?? '').trim() as InquiryStatusInput;
  if (!inquiryId || !STATUS_VALUES.has(next)) return;

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { id: true, status: true, closedAt: true },
  });
  if (!inquiry) return;
  if (inquiry.status === next) return;

  // State machine guard. Silently no-op rather than throw — the dropdown only
  // exposes valid transitions, so this only fires under race conditions.
  const allowed = allowedInquiryTransitions[inquiry.status];
  if (!allowed.includes(next)) return;

  const becomesClosed = CLOSED_STATES.includes(next);
  const wasClosed = inquiry.closedAt !== null;

  await prisma.$transaction([
    prisma.inquiry.update({
      where: { id: inquiry.id },
      data: {
        status: next,
        closedAt: becomesClosed ? new Date() : wasClosed ? null : undefined,
      },
    }),
    prisma.inquiryAuditEntry.create({
      data: {
        inquiryId: inquiry.id,
        actorUserId: admin.userId,
        fromStatus: inquiry.status,
        toStatus: next,
        action: STATUS_TO_AUDIT_ACTION[next],
      },
    }),
  ]);

  revalidatePath('/admin/inquiries');
}
