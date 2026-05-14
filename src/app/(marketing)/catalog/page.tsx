import * as React from 'react';
import Link from 'next/link';
import { Filter, Search } from 'lucide-react';

import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { prisma } from '@/lib/prisma';
import {
  channelTypeAllValues,
  channelTypeLabels,
  type ChannelTypeInput,
} from '@/lib/validation/company';
import { WishlistStar } from '@/app/wishlist/_star';

export const metadata = {
  title: 'Catalog — Advertising Platform',
};

const PAGE_SIZE = 24;
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'soonest', label: 'Soonest availability' },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]['value'];

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function asString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const q = asString(params.q)?.trim() ?? '';
  const channel = asString(params.channel) as ChannelTypeInput | undefined;
  const channelFilter = channelTypeAllValues.includes(
    channel as ChannelTypeInput
  )
    ? (channel as ChannelTypeInput)
    : undefined;
  const sort = (asString(params.sort) ?? 'newest') as SortKey;
  const page = parsePositiveInt(asString(params.page), 1);

  const where: Parameters<typeof prisma.listing.findMany>[0] extends infer T
    ? T extends { where?: infer W }
      ? W
      : never
    : never = {
    status: 'ACTIVE',
    ...(channelFilter ? { channelType: channelFilter } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { sourceChannel: { name: { contains: q } } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === 'soonest'
      ? { availableFrom: 'asc' as const }
      : { createdAt: 'desc' as const };

  const session = await auth();
  const viewerUserId = session?.user?.id;

  const [listings, total, viewer] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        channelType: true,
        availableFrom: true,
        availableTo: true,
        audienceDemographics: true,
        company: { select: { name: true, logoUrl: true } },
        sourceChannel: { select: { name: true } },
      },
    }),
    prisma.listing.count({ where }),
    viewerUserId
      ? prisma.user.findUnique({
          where: { id: viewerUserId },
          select: { role: true },
        })
      : Promise.resolve(null),
  ]);

  const canWishlist = viewer?.role === 'ADVERTISER';
  const savedIds = new Set<string>();
  if (canWishlist && listings.length) {
    const saved = await prisma.wishlistItem.findMany({
      where: {
        userId: viewerUserId!,
        listingId: { in: listings.map((l) => l.id) },
      },
      select: { listingId: true },
    });
    saved.forEach((s) => savedIds.add(s.listingId));
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Catalog</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          What&apos;s available right now
        </h1>
        <p className="text-body-lg text-secondary">
          {total} active listing{total === 1 ? '' : 's'}. No prices — pricing
          comes through the inquiry.
        </p>
      </header>

      <form
        method="get"
        action="/catalog"
        className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5 md:flex-row md:items-end"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="q" className="text-caption uppercase text-tertiary">
            Search
          </label>
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary"
            />
            <Input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Morning drive, Northern Avenue…"
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 md:w-56">
          <label htmlFor="channel" className="text-caption uppercase text-tertiary">
            Channel
          </label>
          <select
            id="channel"
            name="channel"
            defaultValue={channelFilter ?? ''}
            className="flex h-10 w-full rounded border border-border-subtle bg-surface px-3 text-body text-primary focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <option value="">Any channel</option>
            {channelTypeAllValues.map((c) => (
              <option key={c} value={c}>
                {channelTypeLabels[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 md:w-48">
          <label htmlFor="sort" className="text-caption uppercase text-tertiary">
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="flex h-10 w-full rounded border border-border-subtle bg-surface px-3 text-body text-primary focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" className="md:w-auto">
          <Filter size={16} /> Apply
        </Button>
      </form>

      {listings.length === 0 ? (
        <EmptyState hasFilters={Boolean(q || channelFilter)} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => {
            const audience = (l.audienceDemographics ?? {}) as {
              ageRange?: string | null;
              dailyReach?: number | null;
              region?: string | null;
            };
            return (
              <li key={l.id} className="relative">
                <Link
                  href={`/catalog/listings/${l.id}`}
                  className="flex h-full flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5 transition-colors duration-200 ease-out-expo hover:border-border-strong hover:bg-surface-elevated"
                >
                  <p className="text-caption uppercase text-tertiary">
                    {channelTypeLabels[l.channelType as keyof typeof channelTypeLabels]}
                  </p>
                  <h2 className="text-h3 text-primary">{l.title}</h2>
                  <p className="text-body text-secondary">
                    {l.company.name}
                    {l.sourceChannel ? ` · ${l.sourceChannel.name}` : ''}
                  </p>
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
                </Link>
                {canWishlist ? (
                  <WishlistStar listingId={l.id} isSaved={savedIds.has(l.id)} />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <Pagination current={page} total={totalPages} qs={params} />
      ) : null}
    </main>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-border-subtle bg-surface p-8">
      <p className="text-h3 text-primary">
        {hasFilters ? 'No matches. Try removing a filter.' : 'No active listings yet.'}
      </p>
      <p className="text-body text-secondary">
        {hasFilters
          ? 'Adjust your search or pick a different channel.'
          : "Publishers are getting set up. Check back soon — or register as a publisher and list yours."}
      </p>
      <div className="flex gap-2">
        {hasFilters ? (
          <Button asChild variant="outline">
            <Link href="/catalog">Clear filters</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/register">Register</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function Pagination({
  current,
  total,
  qs,
}: {
  current: number;
  total: number;
  qs: Record<string, string | string[] | undefined>;
}) {
  function hrefFor(page: number): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(qs)) {
      if (k === 'page') continue;
      const value = Array.isArray(v) ? v[0] : v;
      if (value) params.set(k, value);
    }
    params.set('page', String(page));
    return `/catalog?${params.toString()}`;
  }
  return (
    <nav className="flex items-center justify-center gap-3 text-body" aria-label="Pagination">
      {current > 1 ? (
        <Link
          href={hrefFor(current - 1)}
          className="text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← Previous
        </Link>
      ) : (
        <span className="text-tertiary">← Previous</span>
      )}
      <span className="text-tertiary">
        Page {current} of {total}
      </span>
      {current < total ? (
        <Link
          href={hrefFor(current + 1)}
          className="text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          Next →
        </Link>
      ) : (
        <span className="text-tertiary">Next →</span>
      )}
    </nav>
  );
}
