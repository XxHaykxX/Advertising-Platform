'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { recordAudit } from '@/lib/audit';
import {
  allowedListingTransitions,
  type ListingStatusInput,
} from '@/lib/validation/listing';

export type OverrideState = {
  ok: boolean;
  formError?: string;
};

const TARGETS = new Set<ListingStatusInput>(['ACTIVE', 'PAUSED', 'CLOSED']);

export async function overrideListing(
  _prev: OverrideState,
  formData: FormData
): Promise<OverrideState> {
  const admin = await requireAdmin();

  const listingId = String(formData.get('listingId') ?? '').trim();
  const target = String(formData.get('target') ?? '').trim() as ListingStatusInput;
  const reason = String(formData.get('reason') ?? '').trim();

  if (!listingId) return { ok: false, formError: 'Missing listing id.' };
  if (!TARGETS.has(target)) return { ok: false, formError: 'Unsupported status.' };
  // Reason is required when pausing / closing (those harm the publisher),
  // optional when reactivating (returning to ACTIVE is restorative).
  if ((target === 'PAUSED' || target === 'CLOSED') && reason.length < 5) {
    return {
      ok: false,
      formError: `Tell the publisher why — at least 5 characters.`,
    };
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      status: true,
      companyId: true,
      company: { select: { users: { select: { id: true } } } },
    },
  });
  if (!listing) return { ok: false, formError: 'Listing not found.' };
  if (!allowedListingTransitions[listing.status as ListingStatusInput].includes(target)) {
    return {
      ok: false,
      formError: `Cannot move a ${listing.status} listing to ${target}.`,
    };
  }

  // Pick the right user-facing copy. Reactivate is a separate code path
  // because it usually doesn't need a reason and the verb is different.
  const verb =
    target === 'PAUSED'
      ? 'paused'
      : target === 'CLOSED'
        ? 'closed'
        : 'reactivated';

  await prisma.$transaction([
    prisma.listing.update({
      where: { id: listing.id },
      data: { status: target },
    }),
    // Notification rows are our audit-trail-of-last-resort here until S-12.x
    // ships a generic AuditEntry. One row per publisher-side user.
    ...listing.company.users.map((u) =>
      prisma.notification.create({
        data: {
          userId: u.id,
          type: 'LISTING_DECISION',
          title: `Admin ${verb} your listing "${listing.title}"`,
          body: reason || null,
          link: '/listings/mine',
        },
      })
    ),
  ]);

  await recordAudit({
    actorUserId: admin.userId,
    action: `LISTING_OVERRIDE_${target}`,
    entityType: 'LISTING',
    entityId: listing.id,
    before: { status: listing.status },
    after: { status: target, reason: reason || null },
  });

  revalidatePath('/admin/listings');
  revalidatePath(`/admin/listings/${listing.id}/override`);
  revalidatePath('/listings/mine');

  redirect('/admin/listings');
}
