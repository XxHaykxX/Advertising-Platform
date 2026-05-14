import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  channelTypeLabels,
  type ChannelTypeInput,
} from '@/lib/validation/company';

import { WishlistStar } from './_star';

export const metadata = {
  title: 'Wishlist — Advertising Platform',
};

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!user) redirect('/login');
  if (user.role !== 'ADVERTISER') redirect('/dashboard');

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      listing: {
        select: {
          id: true,
          title: true,
          status: true,
          channelType: true,
          availableFrom: true,
          availableTo: true,
          audienceDemographics: true,
          company: { select: { name: true } },
        },
      },
    },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Saved</p>
        <h1 className="text-display-lg tracking-tight text-primary">Wishlist</h1>
        <p className="text-body-lg text-secondary">
          Listings you bookmarked from the catalog. {items.length} item
          {items.length === 1 ? '' : 's'}.
        </p>
        <div className="text-body text-secondary">
          <Link
            href="/catalog"
            className="underline-offset-4 hover:text-primary hover:underline"
          >
            Browse catalog →
          </Link>
        </div>
      </header>

      {items.length === 0 ? (
        <section className="rounded-lg border border-border-subtle bg-surface p-8 text-center">
          <p className="text-body text-secondary">
            Nothing saved yet. Star listings from the catalog and they&apos;ll show up
            here.
          </p>
        </section>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const l = item.listing;
            const audience = (l.audienceDemographics ?? {}) as {
              ageRange?: string | null;
              dailyReach?: number | null;
              region?: string | null;
            };
            const isUnavailable = l.status !== 'ACTIVE';
            return (
              <li key={l.id} className="relative flex flex-col gap-2">
                <Link
                  href={`/catalog/listings/${l.id}`}
                  className={`flex h-full flex-col gap-3 rounded-lg border bg-surface p-5 transition-colors duration-200 ease-out-expo ${
                    isUnavailable
                      ? 'border-warning/30 opacity-70'
                      : 'border-border-subtle hover:border-border-strong hover:bg-surface-elevated'
                  }`}
                >
                  <p className="text-caption uppercase text-tertiary">
                    {channelTypeLabels[l.channelType as ChannelTypeInput]}
                    {isUnavailable ? ` · ${l.status}` : ''}
                  </p>
                  <h2 className="text-h3 text-primary">{l.title}</h2>
                  <p className="text-body text-secondary">{l.company.name}</p>
                  <p className="text-caption text-tertiary">
                    {l.availableFrom.toISOString().slice(0, 10)} →{' '}
                    {l.availableTo.toISOString().slice(0, 10)}
                  </p>
                  {audience.region || audience.dailyReach ? (
                    <p className="text-caption text-tertiary">
                      {audience.region ? `${audience.region}` : ''}
                      {audience.region && audience.dailyReach ? ' · ' : ''}
                      {audience.dailyReach
                        ? `~${audience.dailyReach.toLocaleString('en-US')} daily`
                        : ''}
                    </p>
                  ) : null}
                  <p className="mt-auto text-caption text-tertiary">
                    Saved {item.createdAt.toISOString().slice(0, 10)}
                  </p>
                </Link>
                <WishlistStar listingId={l.id} isSaved />
                {!isUnavailable ? (
                  <Link
                    href={`/inquiries/new?listingId=${l.id}`}
                    className="inline-flex w-fit items-center rounded bg-accent px-3 py-1.5 text-caption font-medium text-accent-on transition hover:bg-accent/90 motion-safe:hover:-translate-y-0.5 hover:shadow-md hover:shadow-accent/20"
                  >
                    Inquire →
                  </Link>
                ) : (
                  <p className="text-caption text-tertiary">
                    Listing is {l.status.toLowerCase()} — not available for new inquiries.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
