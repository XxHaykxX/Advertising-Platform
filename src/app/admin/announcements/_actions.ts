'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';

const createSchema = z
  .object({
    title: z.string().trim().min(3, 'Title too short').max(200, 'Title too long'),
    body: z.string().trim().min(3, 'Body too short').max(3000, 'Body too long'),
    audience: z.enum(['ALL', 'ADVERTISERS', 'PUBLISHERS', 'ADMINS']),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine((d) => d.endsAt > d.startsAt, {
    message: 'End must be after start',
    path: ['endsAt'],
  });

export type AnnouncementFormState = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Partial<
    Record<'title' | 'body' | 'audience' | 'startsAt' | 'endsAt', string>
  >;
  successFlash?: string;
};

const initialOk: AnnouncementFormState = { ok: true };

export async function createAnnouncement(
  _prev: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const admin = await requireAdmin();

  const parsed = createSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body'),
    audience: formData.get('audience'),
    startsAt: formData.get('startsAt'),
    endsAt: formData.get('endsAt'),
  });
  if (!parsed.success) {
    const fieldErrors: AnnouncementFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<
        AnnouncementFormState['fieldErrors']
      >;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  await prisma.announcement.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      audience: parsed.data.audience,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
      createdById: admin.userId,
    },
  });

  revalidatePath('/admin/announcements');
  revalidatePath('/dashboard');
  revalidatePath('/admin');
  return { ok: true, successFlash: 'Announcement scheduled.' };
}

/** End an announcement immediately (sets endsAt = now). Soft-archive. */
export async function endAnnouncement(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  if (!id) return;
  await prisma.announcement.update({
    where: { id },
    data: { endsAt: new Date() },
  });
  revalidatePath('/admin/announcements');
  revalidatePath('/dashboard');
  revalidatePath('/admin');
}
