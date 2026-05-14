'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { recordAudit } from '@/lib/audit';
import { setInquirySlaHours } from '@/lib/platform-settings';

const slaSchema = z.object({
  hours: z.coerce
    .number()
    .int()
    .min(1, 'Must be at least 1 hour')
    .max(168, 'Max 168h (1 week)'),
});

export type SettingState = {
  ok: boolean;
  formError?: string;
  successFlash?: string;
};

const initialOk: SettingState = { ok: true };

export async function saveSlaHours(
  _prev: SettingState,
  formData: FormData
): Promise<SettingState> {
  const me = await requireAdmin();
  const parsed = slaSchema.safeParse({ hours: formData.get('hours') });
  if (!parsed.success) {
    return { ok: false, formError: parsed.error.issues[0]?.message ?? 'Invalid' };
  }
  await setInquirySlaHours(parsed.data.hours);
  await recordAudit({
    actorUserId: me.userId,
    action: 'SETTING_SLA_HOURS_CHANGED',
    entityType: 'PLATFORM',
    entityId: 'inquirySlaHours',
    after: { hours: parsed.data.hours },
  });
  revalidatePath('/admin/settings');
  return {
    ok: true,
    successFlash: `Saved. New inquiries from now on use ${parsed.data.hours}h SLA.`,
  };
}

const contentSchema = z.object({
  slug: z.enum(['terms', 'privacy', 'faq']),
  title: z.string().trim().min(2).max(200),
  body: z
    .string()
    .trim()
    .min(20, 'Body must be at least 20 characters')
    .max(20000, 'Body is too long'),
});

export async function saveContent(
  _prev: SettingState,
  formData: FormData
): Promise<SettingState> {
  const me = await requireAdmin();
  const parsed = contentSchema.safeParse({
    slug: formData.get('slug'),
    title: formData.get('title'),
    body: formData.get('body'),
  });
  if (!parsed.success) {
    return { ok: false, formError: parsed.error.issues[0]?.message ?? 'Invalid' };
  }
  const before = await prisma.platformContent.findUnique({
    where: { slug: parsed.data.slug },
    select: { title: true, body: true },
  });
  await prisma.platformContent.upsert({
    where: { slug: parsed.data.slug },
    create: {
      slug: parsed.data.slug,
      title: parsed.data.title,
      body: parsed.data.body,
      updatedById: me.userId,
    },
    update: {
      title: parsed.data.title,
      body: parsed.data.body,
      updatedById: me.userId,
    },
  });
  await recordAudit({
    actorUserId: me.userId,
    action: 'CONTENT_UPDATED',
    entityType: 'PLATFORM',
    entityId: parsed.data.slug,
    before: before ? { title: before.title } : undefined,
    after: { title: parsed.data.title, length: parsed.data.body.length },
  });
  revalidatePath('/admin/settings');
  revalidatePath(`/${parsed.data.slug}`);
  return { ok: true, successFlash: `Saved /${parsed.data.slug}.` };
}
