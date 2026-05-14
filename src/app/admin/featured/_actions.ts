'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { recordAudit } from '@/lib/audit';

const addSchema = z
  .object({
    listingId: z.string().trim().min(1, 'Pick a listing'),
    position: z.coerce.number().int().min(0).max(999),
    startsAt: z.string().trim().optional(),
    endsAt: z.string().trim().optional(),
  })
  .transform((d) => ({
    ...d,
    startsAt: d.startsAt ? new Date(d.startsAt) : null,
    endsAt: d.endsAt ? new Date(d.endsAt) : null,
  }));

export type FeaturedFormState = {
  ok: boolean;
  formError?: string;
  successFlash?: string;
};

const initialOk: FeaturedFormState = { ok: true };

export async function addFeatured(
  _prev: FeaturedFormState,
  formData: FormData
): Promise<FeaturedFormState> {
  const me = await requireAdmin();

  const parsed = addSchema.safeParse({
    listingId: formData.get('listingId'),
    position: formData.get('position'),
    startsAt: formData.get('startsAt') || undefined,
    endsAt: formData.get('endsAt') || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
    select: { id: true, status: true },
  });
  if (!listing) return { ok: false, formError: 'Listing not found.' };
  if (listing.status !== 'ACTIVE') {
    return {
      ok: false,
      formError: 'Only ACTIVE listings can be featured.',
    };
  }

  try {
    const created = await prisma.featuredListing.create({
      data: {
        listingId: parsed.data.listingId,
        position: parsed.data.position,
        startsAt: parsed.data.startsAt,
        endsAt: parsed.data.endsAt,
      },
    });
    await recordAudit({
      actorUserId: me.userId,
      action: 'FEATURED_LISTING_ADDED',
      entityType: 'LISTING',
      entityId: parsed.data.listingId,
      after: {
        position: parsed.data.position,
        window:
          parsed.data.startsAt && parsed.data.endsAt
            ? `${parsed.data.startsAt.toISOString()} → ${parsed.data.endsAt.toISOString()}`
            : 'open-ended',
      },
    });
    void created;
  } catch {
    return {
      ok: false,
      formError: 'This listing is already featured. Edit position instead.',
    };
  }

  revalidatePath('/admin/featured');
  revalidatePath('/');
  return { ok: true, successFlash: 'Featured.' };
}

export async function updatePosition(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  const newPos = Number(formData.get('position'));
  if (!id || !Number.isInteger(newPos) || newPos < 0 || newPos > 999) return;

  const current = await prisma.featuredListing.findUnique({
    where: { id },
    select: { position: true, listingId: true },
  });
  if (!current) return;

  await prisma.featuredListing.update({
    where: { id },
    data: { position: newPos },
  });
  await recordAudit({
    actorUserId: me.userId,
    action: 'FEATURED_LISTING_REORDERED',
    entityType: 'LISTING',
    entityId: current.listingId,
    before: { position: current.position },
    after: { position: newPos },
  });
  revalidatePath('/admin/featured');
  revalidatePath('/');
}

export async function removeFeatured(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  if (!id) return;
  const current = await prisma.featuredListing.findUnique({
    where: { id },
    select: { listingId: true },
  });
  if (!current) return;
  await prisma.featuredListing.delete({ where: { id } });
  await recordAudit({
    actorUserId: me.userId,
    action: 'FEATURED_LISTING_REMOVED',
    entityType: 'LISTING',
    entityId: current.listingId,
  });
  revalidatePath('/admin/featured');
  revalidatePath('/');
}
