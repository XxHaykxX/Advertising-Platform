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

const TERMINAL: ReadonlySet<InquiryStatusInput> = new Set([
  'CONFIRMED',
  'LOST',
  'CANCELLED',
]);

const ACTION_FOR_STATUS: Record<'CONFIRMED' | 'LOST' | 'CANCELLED', string> = {
  CONFIRMED: 'ADMIN_CONFIRMED',
  LOST: 'ADMIN_LOST',
  CANCELLED: 'ADMIN_CANCELLED',
};

/**
 * Bulk assign / unassign. Triggered from the queue selection bar. Idempotent
 * for inquiries already at the target; one audit row per inquiry that
 * actually changed.
 */
export async function bulkAssignInquiries(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const ids = formData
    .getAll('inquiryIds')
    .map((v) => String(v))
    .filter(Boolean);
  if (!ids.length) return;

  const rawTarget = String(formData.get('targetAdminId') ?? '').trim();
  const target =
    rawTarget === '' || rawTarget === 'unassigned' ? null : rawTarget;

  if (target) {
    const t = await prisma.user.findUnique({
      where: { id: target },
      select: { role: true },
    });
    if (!t || t.role !== 'ADMIN') return;
  }

  const existing = await prisma.inquiry.findMany({
    where: { id: { in: ids } },
    select: { id: true, assignedAdminId: true },
  });
  const toUpdate = existing.filter((i) => i.assignedAdminId !== target);
  if (!toUpdate.length) {
    revalidatePath('/admin/inquiries');
    return;
  }

  await prisma.$transaction([
    prisma.inquiry.updateMany({
      where: { id: { in: toUpdate.map((i) => i.id) } },
      data: { assignedAdminId: target },
    }),
    prisma.inquiryAuditEntry.createMany({
      data: toUpdate.map((i) => ({
        inquiryId: i.id,
        actorUserId: admin.userId,
        action: target ? 'ADMIN_REASSIGN' : 'ADMIN_UNASSIGN',
        note: `bulk · ${target ? `→ ${target}` : 'unassigned'}`,
      })),
    }),
  ]);

  // Unified audit — one row per inquiry that actually changed.
  await Promise.all(
    toUpdate.map((i) =>
      recordAudit({
        actorUserId: admin.userId,
        action: target ? 'INQUIRY_BULK_REASSIGNED' : 'INQUIRY_BULK_UNASSIGNED',
        entityType: 'INQUIRY',
        entityId: i.id,
        before: { assignedAdminId: i.assignedAdminId },
        after: { assignedAdminId: target },
      })
    )
  );

  revalidatePath('/admin/inquiries');
}

export type BulkCloseState = {
  ok: boolean;
  formError?: string;
  closedCount?: number;
  skippedCount?: number;
};

/**
 * Bulk close (Confirmed / Lost / Cancelled) with a shared reason. Inquiries
 * that aren't in an open state at the time the action runs are silently
 * skipped — the reported `skippedCount` lets the caller surface it.
 */
export async function bulkCloseInquiries(
  _prev: BulkCloseState,
  formData: FormData
): Promise<BulkCloseState> {
  const admin = await requireAdmin();

  const ids = formData
    .getAll('inquiryIds')
    .map((v) => String(v))
    .filter(Boolean);
  const target = String(formData.get('target') ?? '').trim() as InquiryStatusInput;
  const reason = String(formData.get('reason') ?? '').trim();

  if (!ids.length) {
    return { ok: false, formError: 'No inquiries selected.' };
  }
  if (!TERMINAL.has(target)) {
    return { ok: false, formError: 'Unsupported close state.' };
  }
  if ((target === 'LOST' || target === 'CANCELLED') && reason.length < 5) {
    return {
      ok: false,
      formError:
        target === 'LOST'
          ? 'Lost requires a shared reason (≥5 chars).'
          : 'Cancelled requires a shared reason (≥5 chars).',
    };
  }

  const inquiries = await prisma.inquiry.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true },
  });

  const valid = inquiries.filter((i) =>
    allowedInquiryTransitions[i.status].includes(target)
  );
  const skipped = inquiries.length - valid.length;
  if (!valid.length) {
    return {
      ok: false,
      formError: `None of the ${inquiries.length} selected inquiries can move to ${target.toLowerCase()}.`,
    };
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.inquiry.updateMany({
      where: { id: { in: valid.map((i) => i.id) } },
      data: {
        status: target,
        closedAt: now,
        closeReason: reason || null,
      },
    }),
    prisma.inquiryAuditEntry.createMany({
      data: valid.map((i) => ({
        inquiryId: i.id,
        actorUserId: admin.userId,
        fromStatus: i.status,
        toStatus: target,
        action: ACTION_FOR_STATUS[target as 'CONFIRMED' | 'LOST' | 'CANCELLED'],
        note: reason ? `bulk · ${reason}` : 'bulk',
      })),
    }),
  ]);

  await Promise.all(
    valid.map((i) =>
      recordAudit({
        actorUserId: admin.userId,
        action: `INQUIRY_BULK_${target}`,
        entityType: 'INQUIRY',
        entityId: i.id,
        before: { status: i.status },
        after: { status: target, reason: reason || null },
      })
    )
  );

  revalidatePath('/admin/inquiries');
  // Hand-off to the queue with a flash via search params; the page picks it up.
  redirect(
    `/admin/inquiries?bulkClosed=${valid.length}${skipped ? `&bulkSkipped=${skipped}` : ''}`
  );
}
