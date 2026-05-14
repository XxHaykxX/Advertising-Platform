import * as React from 'react';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { mockFeaturedListings } from '@/lib/mock-listings';
import {
  channelTypeLabels,
  type ChannelTypeInput,
} from '@/lib/validation/company';

export async function FeaturedListings() {
  const now = new Date();
  const featured = await prisma.featuredListing.findMany({
    where: {
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
      listing: { status: 'ACTIVE' },
    },
    orderBy: { position: 'asc' },
    take: 6,
    select: {
      id: true,
      listing: {
        select: {
          id: true,
          title: true,
          channelType: true,
          audienceDemographics: true,
          company: { select: { name: true } },
          sourceChannel: { select: { name: true } },
        },
      },
    },
  });

  const usingMock = featured.length === 0;

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-20">
      <header className="flex items-baseline justify-between gap-4">
        <h2 className="text-display-lg tracking-tight text-primary">
          Advertising opportunities
        </h2>
        {usingMock ? (
          <p className="text-body text-tertiary">Sample — live data after pilot launch</p>
        ) : null}
      </header>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {usingMock
          ? mockFeaturedListings.map((listing) => (
              <li key={listing.id}>
                <Card className="h-full">
                  <CardHeader>
                    <p className="text-caption uppercase text-tertiary">{listing.channel}</p>
                    <CardTitle>{listing.publisher}</CardTitle>
                    <CardDescription>{listing.format}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-body text-secondary">
                      Reach: <span className="text-primary">{listing.reach}</span>
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))
          : featured.map((f) => {
              const audience = (f.listing.audienceDemographics ?? {}) as {
                dailyReach?: number | null;
                region?: string | null;
              };
              return (
                <li key={f.id}>
                  <Link
                    href={`/catalog/listings/${f.listing.id}`}
                    className="block h-full"
                  >
                    <Card className="h-full transition-colors hover:border-border-strong">
                      <CardHeader>
                        <p className="text-caption uppercase text-tertiary">
                          {channelTypeLabels[
                            f.listing.channelType as ChannelTypeInput
                          ] ?? f.listing.channelType}
                        </p>
                        <CardTitle>{f.listing.company.name}</CardTitle>
                        <CardDescription>{f.listing.title}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {audience.region || audience.dailyReach ? (
                          <p className="text-body text-secondary">
                            {audience.region ? `${audience.region}` : ''}
                            {audience.region && audience.dailyReach ? ' · ' : ''}
                            {audience.dailyReach
                              ? `~${audience.dailyReach.toLocaleString('en-US')} daily reach`
                              : ''}
                          </p>
                        ) : (
                          <p className="text-body text-tertiary">
                            Audience details on the listing page.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
      </ul>
    </section>
  );
}
