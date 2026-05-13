import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Eye, MessageSquare, Plus } from 'lucide-react';

import { auth } from '@/auth';
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

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
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
              <div className="flex items-center gap-5 text-caption text-tertiary">
                <span className="inline-flex items-center gap-1">
                  <Eye size={14} /> {l.viewCount}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare size={14} /> {l.inquiryCount}
                </span>
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
