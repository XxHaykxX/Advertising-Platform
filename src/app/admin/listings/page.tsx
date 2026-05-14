import * as React from 'react';
import Link from 'next/link';

import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import type { ChannelType, ListingStatus, Prisma } from '@prisma/client';

export const metadata = {
  title: 'Listings — Admin',
};

const PAGE_SIZE = 50;

const STATUS_VALUES: ListingStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED'];

const CHANNEL_VALUES: ChannelType[] = [
  'PRODUCT_PLACEMENT',
  'IN_VIDEO_AD',
  'WEBSITE_BANNER',
  'TV',
  'RADIO',
  'OUTDOOR',
  'SOCIAL',
  'PODCAST',
  'PRINT',
  'INFLUENCER',
  'EVENT',
];

const STATUS_BADGE_TONE: Record<ListingStatus, string> = {
  DRAFT: 'bg-surface text-tertiary border-border-subtle',
  ACTIVE: 'bg-success/10 text-success border-success/30',
  PAUSED: 'bg-warning/10 text-warning border-warning/30',
  CLOSED: 'bg-danger/10 text-danger border-danger/30',
};

const dateFmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

function asString(value: string | string[] | undefined): string {
  if (!value) return '';
  return Array.isArray(value) ? (value[0] ?? '') : value;
}

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function AdminListingsPage({ searchParams }: PageProps) {
  await requireAdmin();

  const status = asString(searchParams.status) as ListingStatus | '';
  const channel = asString(searchParams.channel) as ChannelType | '';
  const q = asString(searchParams.q).trim();
  const page = Math.max(1, Number(asString(searchParams.page)) || 1);

  const where: Prisma.ListingWhereInput = {};
  if (status && (STATUS_VALUES as string[]).includes(status)) where.status = status;
  if (channel && (CHANNEL_VALUES as string[]).includes(channel)) where.channelType = channel;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { company: { name: { contains: q } } },
      { id: { endsWith: q } },
    ];
  }

  const [total, listings] = await prisma.$transaction([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        status: true,
        channelType: true,
        availableFrom: true,
        availableTo: true,
        viewCount: true,
        inquiryCount: true,
        company: { select: { id: true, name: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  function pageHref(target: number): string {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (channel) params.set('channel', channel);
    if (q) params.set('q', q);
    if (target > 1) params.set('page', String(target));
    const qs = params.toString();
    return qs ? `/admin/listings?${qs}` : '/admin/listings';
  }

  const hasFilters = Boolean(status || channel || q);

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-8 py-10">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-caption uppercase text-tertiary">Super Admin · Inventory</p>
          <h1 className="text-display-md tracking-tight text-primary">Listings</h1>
          <p className="text-body text-secondary">
            {total} listing{total === 1 ? '' : 's'}
            {hasFilters ? ' matching current filters' : ''}.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← Admin home
        </Link>
      </header>

      <form
        method="get"
        className="grid grid-cols-1 gap-4 rounded-lg border border-border-subtle bg-surface p-5 md:grid-cols-4"
      >
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Title, company, or ID"
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Status</span>
          <select
            name="status"
            defaultValue={status}
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          >
            <option value="">Any</option>
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Channel</span>
          <select
            name="channel"
            defaultValue={channel}
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          >
            <option value="">Any</option>
            {CHANNEL_VALUES.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded bg-accent px-4 text-body font-medium text-accent-on transition hover:bg-accent/90 motion-safe:hover:-translate-y-1 hover:shadow-md hover:shadow-accent/20"
          >
            Apply
          </button>
          {hasFilters ? (
            <Link
              href="/admin/listings"
              className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              Reset
            </Link>
          ) : null}
        </div>
      </form>

      <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        {listings.length === 0 ? (
          <p className="p-8 text-center text-body text-secondary">
            No listings match these filters.
          </p>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="bg-background text-caption uppercase text-tertiary">
              <tr>
                <th className="px-4 py-3 font-medium">Listing</th>
                <th className="px-4 py-3 font-medium">Publisher</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Window</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Views / inq.</th>
                <th className="px-4 py-3 font-medium">Override</th>
              </tr>
            </thead>
            <tbody className="text-body text-primary">
              {listings.map((l) => (
                <tr
                  key={l.id}
                  className="border-t border-border-subtle hover:bg-background"
                >
                  <td className="px-4 py-3">
                    <p className="text-primary">{l.title}</p>
                    <p className="font-mono text-caption text-tertiary">
                      LST-{l.id.slice(-8)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-secondary">{l.company.name}</td>
                  <td className="px-4 py-3 text-secondary">
                    {l.channelType.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-caption text-secondary">
                    {dateFmt.format(l.availableFrom)} – {dateFmt.format(l.availableTo)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded border px-2 py-0.5 text-caption ${STATUS_BADGE_TONE[l.status]}`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {l.viewCount} / {l.inquiryCount}
                  </td>
                  <td className="px-4 py-3">
                    {l.status === 'ACTIVE' ? (
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/listings/${l.id}/override?to=paused`}
                          className="text-caption text-warning underline-offset-4 hover:underline"
                        >
                          Pause
                        </Link>
                        <Link
                          href={`/admin/listings/${l.id}/override?to=closed`}
                          className="text-caption text-danger underline-offset-4 hover:underline"
                        >
                          Close
                        </Link>
                      </div>
                    ) : l.status === 'PAUSED' ? (
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/listings/${l.id}/override?to=active`}
                          className="text-caption text-success underline-offset-4 hover:underline"
                        >
                          Reactivate
                        </Link>
                        <Link
                          href={`/admin/listings/${l.id}/override?to=closed`}
                          className="text-caption text-danger underline-offset-4 hover:underline"
                        >
                          Close
                        </Link>
                      </div>
                    ) : (
                      <span className="text-caption text-tertiary">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {totalPages > 1 ? (
        <nav className="flex items-center justify-between gap-4">
          <p className="text-caption text-tertiary">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-3">
            {currentPage > 1 ? (
              <Link
                href={pageHref(currentPage - 1)}
                className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
              >
                ← Previous
              </Link>
            ) : null}
            {currentPage < totalPages ? (
              <Link
                href={pageHref(currentPage + 1)}
                className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </main>
  );
}
