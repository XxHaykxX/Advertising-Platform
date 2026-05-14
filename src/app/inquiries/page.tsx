import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Inbox } from 'lucide-react';

import { auth } from '@/auth';
import { AnnouncementBanner } from '@/components/announcement-banner';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import {
  inquiryClosedStatuses,
  inquiryOpenStatuses,
  inquiryStatusLabels,
  type InquiryStatusInput,
} from '@/lib/validation/inquiry';

export const metadata = {
  title: 'My inquiries — Advertising Platform',
};

type Filter = 'all' | 'open' | 'awaiting' | 'confirmed' | 'closed';

const filterChips: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'awaiting', label: 'Awaiting you' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'closed', label: 'Closed' },
];

const statusStyles: Record<InquiryStatusInput, string> = {
  NEW: 'border-info/30 bg-info/10 text-info',
  ASSIGNED: 'border-info/30 bg-info/10 text-info',
  IN_PROGRESS: 'border-info/30 bg-info/10 text-info',
  AWAITING_PUBLISHER: 'border-warning/30 bg-warning/10 text-warning',
  AWAITING_ADVERTISER: 'border-warning/30 bg-warning/10 text-warning',
  CONFIRMED: 'border-accent/30 bg-accent/10 text-accent',
  LOST: 'border-border-subtle bg-surface text-tertiary',
  CANCELLED: 'border-border-subtle bg-surface text-tertiary',
};

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

function statusesForFilter(filter: Filter): InquiryStatusInput[] | undefined {
  switch (filter) {
    case 'open':
      return inquiryOpenStatuses;
    case 'awaiting':
      return ['AWAITING_ADVERTISER'];
    case 'confirmed':
      return ['CONFIRMED'];
    case 'closed':
      return inquiryClosedStatuses;
    case 'all':
    default:
      return undefined;
  }
}

export default async function MyInquiriesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, company: { select: { id: true, canAdvertise: true } } },
  });
  if (!user) redirect('/login');
  if (!user.company) redirect('/company-profile');
  if (user.role !== 'ADVERTISER') redirect('/dashboard');

  const params = await searchParams;
  const filter: Filter = (filterChips.find((c) => c.value === params.filter)?.value ??
    'all') as Filter;
  const statuses = statusesForFilter(filter);

  const inquiries = await prisma.inquiry.findMany({
    where: {
      advertiserUserId: session.user.id,
      ...(statuses ? { status: { in: statuses } } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      publisherCompany: { select: { name: true } },
      listing: { select: { title: true } },
    },
  });

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
      <AnnouncementBanner />
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-caption uppercase text-tertiary">Advertiser</p>
          <h1 className="text-display-lg tracking-tight text-primary">
            My inquiries
          </h1>
          <p className="text-body-lg text-secondary">
            Everything you&apos;ve sent. Updates land in your inbox and as in-app
            notifications.
          </p>
        </div>
        {user.company.canAdvertise ? (
          <Button asChild>
            <Link href="/catalog">Browse opportunities</Link>
          </Button>
        ) : null}
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Filter">
        {filterChips.map((chip) => (
          <Link
            key={chip.value}
            href={chip.value === 'all' ? '/inquiries' : `/inquiries?filter=${chip.value}`}
            className={
              filter === chip.value
                ? 'rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-caption uppercase text-accent'
                : 'rounded-full border border-border-subtle bg-surface px-3 py-1 text-caption uppercase text-secondary hover:border-border-strong hover:text-primary'
            }
          >
            {chip.label}
          </Link>
        ))}
      </nav>

      {inquiries.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-lg border border-border-subtle bg-surface p-8">
          <Inbox size={24} className="text-tertiary" />
          <p className="text-h3 text-primary">No inquiries yet. Browse opportunities.</p>
          <Button asChild>
            <Link href="/catalog">Browse →</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {inquiries.map((inq) => (
            <li key={inq.id}>
              <Link
                href={`/inquiries/${inq.id}`}
                className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface p-5 transition-colors duration-200 ease-out-expo hover:border-border-strong hover:bg-surface-elevated"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-h3 text-primary">
                    {inq.listing?.title ?? `${inq.publisherCompany.name} (general)`}
                  </h2>
                  <span
                    className={`rounded-full border px-3 py-1 text-caption uppercase ${statusStyles[inq.status as InquiryStatusInput]}`}
                  >
                    {inquiryStatusLabels[inq.status as InquiryStatusInput]}
                  </span>
                </div>
                <p className="text-body text-secondary">
                  {inq.publisherCompany.name}
                </p>
                <p className="text-caption text-tertiary">
                  Submitted {inq.createdAt.toISOString().slice(0, 10)} · Last
                  activity {inq.updatedAt.toISOString().slice(0, 10)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
