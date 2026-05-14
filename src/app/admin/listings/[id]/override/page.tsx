import * as React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import {
  allowedListingTransitions,
  type ListingStatusInput,
} from '@/lib/validation/listing';

import { OverrideForm } from './_form';

export const metadata = {
  title: 'Override listing — Admin',
};

interface PageProps {
  params: { id: string };
  searchParams: { to?: string };
}

export default async function ListingOverridePage({ params, searchParams }: PageProps) {
  await requireAdmin();

  const target = (searchParams.to ?? '').toUpperCase() as ListingStatusInput;
  if (!['ACTIVE', 'PAUSED', 'CLOSED'].includes(target)) {
    redirect('/admin/listings');
  }

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      status: true,
      channelType: true,
      company: { select: { name: true } },
    },
  });
  if (!listing) notFound();

  const canTransition = allowedListingTransitions[listing.status as ListingStatusInput].includes(
    target
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-8 py-12">
      <header className="flex flex-col gap-3">
        <Link
          href="/admin/listings"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← Cancel and return to listings
        </Link>
        <p className="text-caption uppercase text-tertiary">
          LST-{listing.id.slice(-8)} · {listing.status} → {target}
        </p>
        <h1 className="text-display-md tracking-tight text-primary">
          {target === 'ACTIVE'
            ? 'Reactivate listing'
            : target === 'PAUSED'
              ? 'Pause listing'
              : 'Close listing'}
        </h1>
        <p className="text-body text-secondary">
          {listing.title} · {listing.company.name} · {listing.channelType.replace(/_/g, ' ')}
        </p>
      </header>

      {!canTransition ? (
        <section className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-body text-danger">
          A {listing.status} listing cannot move to {target}.
        </section>
      ) : (
        <OverrideForm listingId={listing.id} target={target as 'ACTIVE' | 'PAUSED' | 'CLOSED'} />
      )}
    </main>
  );
}
