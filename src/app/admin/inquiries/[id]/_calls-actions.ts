'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';

const SIDES = new Set(['ADVERTISER', 'PUBLISHER', 'OTHER']);

export type CallState = {
  ok: boolean;
  formError?: string;
};

const initialOk: CallState = { ok: true };

export async function logCall(_prev: CallState, formData: FormData): Promise<CallState> {
  const admin = await requireAdmin();

  const inquiryId = String(formData.get('inquiryId') ?? '').trim();
  const side = String(formData.get('side') ?? '').trim().toUpperCase();
  const occurredAtRaw = String(formData.get('occurredAt') ?? '').trim();
  const durationRaw = String(formData.get('durationMinutes') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();

  if (!inquiryId) return { ok: false, formError: 'Missing inquiry.' };
  if (!SIDES.has(side)) {
    return { ok: false, formError: 'Pick a side: Advertiser / Publisher / Other.' };
  }
  const occurredAt = occurredAtRaw ? new Date(occurredAtRaw) : new Date();
  if (Number.isNaN(occurredAt.getTime())) {
    return { ok: false, formError: 'Invalid date/time.' };
  }
  const durationMinutes = Number(durationRaw);
  if (!Number.isFinite(durationMinutes) || durationMinutes < 1 || durationMinutes > 600) {
    return { ok: false, formError: 'Duration must be 1–600 minutes.' };
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { id: true },
  });
  if (!inquiry) return { ok: false, formError: 'Inquiry not found.' };

  await prisma.call.create({
    data: {
      inquiryId: inquiry.id,
      loggedByAdminId: admin.userId,
      occurredAt,
      durationMinutes: Math.round(durationMinutes),
      side,
      notes: notes || null,
    },
  });

  revalidatePath(`/admin/inquiries/${inquiry.id}`);
  return initialOk;
}
