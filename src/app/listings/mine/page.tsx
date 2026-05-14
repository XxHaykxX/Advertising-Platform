import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Eye, MessageSquare, Plus } from 'lucide-react';

import { auth } from '@/auth';
import { AnnouncementBanner } from '@/components/announcement-banner';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { channelTypeLabels } from '@/lib/validation/company';

import { ListingStatusControls } from './_status-controls';

export const metadata = {
  title: 'My listings — Advertising Platform',
};

const statusStyles: Record<string, string> = {
  DRAFT: 'border-border-subtle bg-surface text-tertiary',
  ACTIVE: 'border-accent/30 bg-accent/10 text-accent',
  PAUSED: 'border-warning/30 bg-warning/10 text-warning',
  CLOSED: 'border-border-subtle bg-surface text-tertiary',
};

export default async function MyListingsPage() {
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
  if (user.role !== 'PUBLISHER') redirect('/dashboard');
  if (!user.company) redirect('/company-profile');

  const listings = await prisma.listing.findMany({
    where: { companyId: user.company.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      channelType: true,
      availableFrom: true,
      availableTo: true,
      viewCount: true,
      inquiryCount: true,
      sourceChannel: { select: { name: true } },
    },
  });

  // S-04.4 per-listing analytics: split inquiry counts by status so a
  // publisher can see "of 12 inquiries, 3 confirmed, 6 still open, 3 lost".
  const inquiryBuckets = listings.length
    ? await prisma.inquiry.groupBy({
        by: ['listingId', 'status'],
        _count: { _all: true },
        where: {
          listingId: { in: listings.map((l) => l.id) },
        },
      })
    : [];

  type Bucket = { open: number; confirmed: number; lost: number; cancelled: number };
  const bucketsByListing = new Map<string, Bucket>();
  for (const row of inquiryBuckets) {
    if (!row.listingId) continue;
    const b = bucketsByListing.get(row.listingId) ?? {
      open: 0,
      confirmed: 0,
      lost: 0,
      cancelled: 0,
    };
    const n = row._count._all;
    switch (row.status) {
      case 'CONFIRMED':
        b.confirmed += n;
        break;
      case 'LOST':
        b.lost += n;
        break;
      case 'CANCELLED':
        b.cancelled += n;
        break;
      default:
        b.open += n;
    }
    bucketsByListing.set(row.listingId, b);
  }

  // Page-level totals.
  const totalViews = listings.reduce((acc, l) => acc + l.viewCount, 0);
  const totalInquiries = listings.reduce((acc, l) => acc + l.inquiryCount, 0);
  const totalConfirmed = Array.from(bucketsByListing.values()).reduce(
    (acc, b) => acc + b.confirmed,
    0
  );
  const totalActive = listings.filter((l) => l.status === 'ACTIVE').length;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
      <AnnouncementBanner />
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-caption uppercase text-tertiary">Publisher</p>
          <h1 className="text-display-lg tracking-tight text-primary">
            My listings
          </h1>
          <p className="text-body-lg text-secondary">
            Drafts, active inventory, and anything you&apos;ve paused or
            closed.
          </p>
        </div>
        {user.company.canPublish ? (
          <Button asChild>
            <Link href="/listings/new">
              <Plus size={18} /> New listing
            </Link>
          </Button>
        ) : null}
      </header>

      {!user.company.canPublish ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-5">
          <p className="text-caption uppercase text-warning">Pending verification</p>
          <p className="mt-1 text-body-lg text-primary">
            Your company isn&apos;t verified yet, so the catalog can&apos;t see
            your listings. Submit documents to unlock publishing.
          </p>
          <div className="mt-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/company-profile/verification">Submit documents</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {listings.length ? (
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatTile label="Active listings" value={totalActive} />
          <StatTile label="Total views" value={totalViews} />
          <StatTile label="Total inquiries" value={totalInquiries} />
          <StatTile label="Confirmed deals" value={totalConfirmed} highlight />
        </section>
      ) : null}

      {listings.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-lg border border-border-subtle bg-surface p-6">
          <p className="text-body-lg text-primary">No listings yet.</p>
          <p className="text-body text-secondary">
            Create your first listing — it starts as a draft and only goes
            live when you flip it to Active.
          </p>
          {user.company.canPublish ? (
            <Button asChild>
              <Link href="/listings/new">Create the first one</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {listings.map((l) => (
            <li
              key={l.id}
              className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <Link
                  href={`/listings/${l.id}/edit`}
                  className="text-h3 text-primary underline-offset-4 hover:underline"
                >
                  {l.title}
                </Link>
                <span
                  className={`rounded-full border px-3 py-1 text-caption uppercase ${statusStyles[l.status] ?? statusStyles.DRAFT}`}
                >
                  {l.status}
                </span>
              </div>
              <p className="text-body text-secondary">
                {channelTypeLabels[l.channelType as keyof typeof channelTypeLabels]}
                {l.sourceChannel ? ` · ${l.sourceChannel.name}` : ''} ·{' '}
                {l.availableFrom.toISOString().slice(0, 10)} →{' '}
                {l.availableTo.toISOString().slice(0, 10)}
              </p>
              <div className="flex flex-wrap items-center gap-5 text-caption text-tertiary">
                <span className="inline-flex items-center gap-1">
                  <Eye size={14} /> {l.viewCount} views
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare size={14} /> {l.inquiryCount} inquir
                  {l.inquiryCount === 1 ? 'y' : 'ies'}
                </span>
                {(() => {
                  const b = bucketsByListing.get(l.id);
                  if (!b || b.open + b.confirmed + b.lost + b.cancelled === 0) {
                    return null;
                  }
                  return (
                    <span className="inline-flex items-center gap-3">
                      {b.confirmed ? (
                        <span className="text-success">{b.confirmed} confirmed</span>
                      ) : null}
                      {b.open ? <span className="text-info">{b.open} open</span> : null}
                      {b.lost ? <span className="text-danger">{b.lost} lost</span> : null}
                      {b.cancelled ? (
                        <span className="text-tertiary">{b.cancelled} cancelled</span>
                      ) : null}
                    </span>
                  );
                })()}
              </div>
              <ListingStatusControls
                listingId={l.id}
                status={l.status as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED'}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function StatTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-lg border bg-surface p-4 ${
        highlight ? 'border-accent/40' : 'border-border-subtle'
      }`}
    >
      <p className="text-caption uppercase text-tertiary">{label}</p>
      <p
        className={`text-display-md tracking-tight ${highlight ? 'text-accent' : 'text-primary'}`}
      >
        {value}
      </p>
    </div>
  );
}
