import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

import { ListingStatusControls } from '../../mine/_status-controls';
import { EditListingForm } from './_form';

export const metadata = {
  title: 'Edit listing — Advertising Platform',
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}

interface AudienceJson {
  ageRange?: string | null;
  dailyReach?: number | null;
  region?: string | null;
}

export default async function EditListingPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { created } = await searchParams;

  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, company: { select: { id: true } } },
  });
  if (!user?.company || user.role !== 'PUBLISHER') redirect('/dashboard');

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      companyId: true,
      title: true,
      channelType: true,
      sourceChannel: { select: { name: true } },
      availableFrom: true,
      availableTo: true,
      audienceDemographics: true,
      description: true,
      status: true,
    },
  });
  if (!listing || listing.companyId !== user.company.id) redirect('/listings/mine');

  const audience = (listing.audienceDemographics ?? {}) as AudienceJson;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <Link
        href="/listings/mine"
        className="inline-flex w-fit items-center gap-1 text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
      >
        <ArrowLeft size={14} /> My listings
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">
          Editing · {listing.status}
        </p>
        <h1 className="text-display-lg tracking-tight text-primary">
          {listing.title}
        </h1>
        <p className="text-body-lg text-secondary">
          Changes are visible to advertisers as soon as you save (assuming the
          listing is Active).
        </p>
      </header>

      <ListingStatusControls
        listingId={listing.id}
        status={listing.status as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED'}
      />

      <EditListingForm
        listingId={listing.id}
        disabled={listing.status === 'CLOSED'}
        justCreated={created === '1'}
        defaults={{
          title: listing.title,
          channelType: listing.channelType,
          sourceChannelName: listing.sourceChannel?.name ?? '',
          availableFrom: listing.availableFrom.toISOString().slice(0, 10),
          availableTo: listing.availableTo.toISOString().slice(0, 10),
          description: listing.description,
          ageRange: audience.ageRange ?? '',
          dailyReach: audience.dailyReach ?? null,
          region: audience.region ?? '',
        }}
      />
    </main>
  );
}
