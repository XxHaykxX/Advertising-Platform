'use server';

import type { Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  canTransitionListing,
  listingSchema,
  listingStatusEnum,
  type ListingStatusInput,
} from '@/lib/validation/listing';

export type ListingActionState = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Partial<
    Record<
      | 'title'
      | 'channelType'
      | 'sourceChannelName'
      | 'availableFrom'
      | 'availableTo'
      | 'description'
      | 'ageRange'
      | 'dailyReach'
      | 'region',
      string
    >
  >;
};

async function requireVerifiedPublisher() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      company: { select: { id: true, canPublish: true } },
    },
  });
  if (!user) redirect('/login');
  if (!user.company) redirect('/company-profile');
  if (user.role !== 'PUBLISHER') redirect('/dashboard');
  if (!user.company.canPublish) redirect('/dashboard');
  return { userId: session.user.id, companyId: user.company.id };
}

function parseListingForm(formData: FormData) {
  const raw = {
    title: formData.get('title'),
    channelType: formData.get('channelType'),
    sourceChannelName: formData.get('sourceChannelName'),
    availableFrom: formData.get('availableFrom'),
    availableTo: formData.get('availableTo'),
    description: formData.get('description'),
    audience: {
      ageRange: formData.get('ageRange') || undefined,
      dailyReach: formData.get('dailyReach') || undefined,
      region: formData.get('region') || undefined,
    },
  };
  return listingSchema.safeParse(raw);
}

async function findOrCreateSourceChannel(
  companyId: string,
  name: string,
  channelType: ListingStatusInput | string
) {
  const existing = await prisma.sourceChannel.findFirst({
    where: {
      ownerCompanyId: companyId,
      name: { equals: name },
      type: channelType as never,
      archived: false,
    },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.sourceChannel.create({
    data: {
      name,
      type: channelType as never,
      ownerCompanyId: companyId,
    },
    select: { id: true },
  });
  return created.id;
}

// ─── createListing ─────────────────────────────────────────────────────────

export async function createListing(
  _prev: ListingActionState,
  formData: FormData
): Promise<ListingActionState> {
  const { companyId } = await requireVerifiedPublisher();

  const parsed = parseListingForm(formData);
  if (!parsed.success) {
    const fieldErrors: ListingActionState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const top = issue.path[0];
      const sub = issue.path[1];
      const key =
        top === 'audience'
          ? (sub as keyof NonNullable<ListingActionState['fieldErrors']>)
          : (top as keyof NonNullable<ListingActionState['fieldErrors']>);
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const input = parsed.data;

  const sourceChannelId = await findOrCreateSourceChannel(
    companyId,
    input.sourceChannelName,
    input.channelType
  );

  const audienceJson: Prisma.InputJsonValue = {
    ageRange: input.audience.ageRange ?? null,
    dailyReach: input.audience.dailyReach ?? null,
    region: input.audience.region ?? null,
  };

  const listing = await prisma.listing.create({
    data: {
      companyId,
      title: input.title,
      channelType: input.channelType,
      sourceChannelId,
      availableFrom: input.availableFrom,
      availableTo: input.availableTo,
      audienceDemographics: audienceJson,
      description: input.description,
      status: 'DRAFT',
    },
    select: { id: true },
  });

  revalidatePath('/listings/mine');
  redirect(`/listings/${listing.id}/edit?created=1`);
}

// ─── updateListing ─────────────────────────────────────────────────────────

export async function updateListing(
  listingId: string,
  _prev: ListingActionState,
  formData: FormData
): Promise<ListingActionState> {
  const { companyId } = await requireVerifiedPublisher();

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { companyId: true, status: true },
  });
  if (!listing || listing.companyId !== companyId) {
    return { ok: false, formError: 'Listing not found.' };
  }
  if (listing.status === 'CLOSED') {
    return { ok: false, formError: 'Closed listings cannot be edited.' };
  }

  const parsed = parseListingForm(formData);
  if (!parsed.success) {
    const fieldErrors: ListingActionState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const top = issue.path[0];
      const sub = issue.path[1];
      const key =
        top === 'audience'
          ? (sub as keyof NonNullable<ListingActionState['fieldErrors']>)
          : (top as keyof NonNullable<ListingActionState['fieldErrors']>);
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const input = parsed.data;

  const sourceChannelId = await findOrCreateSourceChannel(
    companyId,
    input.sourceChannelName,
    input.channelType
  );

  const audienceJson: Prisma.InputJsonValue = {
    ageRange: input.audience.ageRange ?? null,
    dailyReach: input.audience.dailyReach ?? null,
    region: input.audience.region ?? null,
  };

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      title: input.title,
      channelType: input.channelType,
      sourceChannelId,
      availableFrom: input.availableFrom,
      availableTo: input.availableTo,
      audienceDemographics: audienceJson,
      description: input.description,
    },
  });

  revalidatePath('/listings/mine');
  revalidatePath(`/listings/${listingId}/edit`);
  return { ok: true };
}

// ─── changeListingStatus ──────────────────────────────────────────────────

export async function changeListingStatus(
  listingId: string,
  next: ListingStatusInput
): Promise<{ ok: boolean; error?: string }> {
  const { companyId } = await requireVerifiedPublisher();

  const parsed = listingStatusEnum.safeParse(next);
  if (!parsed.success) return { ok: false, error: 'Invalid status' };

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { companyId: true, status: true },
  });
  if (!listing || listing.companyId !== companyId) {
    return { ok: false, error: 'Listing not found' };
  }

  if (!canTransitionListing(listing.status, parsed.data)) {
    return {
      ok: false,
      error: `Cannot move a ${listing.status.toLowerCase()} listing to ${parsed.data.toLowerCase()}.`,
    };
  }

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: parsed.data },
  });

  revalidatePath('/listings/mine');
  revalidatePath(`/listings/${listingId}/edit`);
  return { ok: true };
}
