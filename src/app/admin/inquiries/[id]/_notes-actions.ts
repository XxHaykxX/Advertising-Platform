'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';

export type NoteState = {
  ok: boolean;
  formError?: string;
};

const MIN_NOTE = 3;
const MAX_NOTE = 3000;

export async function addInternalNote(
  _prev: NoteState,
  formData: FormData
): Promise<NoteState> {
  const admin = await requireAdmin();

  const inquiryId = String(formData.get('inquiryId') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();

  if (!inquiryId) return { ok: false, formError: 'Missing inquiry.' };
  if (body.length < MIN_NOTE) {
    return { ok: false, formError: `Note must be at least ${MIN_NOTE} characters.` };
  }
  if (body.length > MAX_NOTE) {
    return { ok: false, formError: `Note is too long (max ${MAX_NOTE} characters).` };
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { id: true },
  });
  if (!inquiry) return { ok: false, formError: 'Inquiry not found.' };

  await prisma.internalNote.create({
    data: {
      inquiryId: inquiry.id,
      authorAdminId: admin.userId,
      body,
    },
  });

  revalidatePath(`/admin/inquiries/${inquiry.id}`);
  return { ok: true };
}
