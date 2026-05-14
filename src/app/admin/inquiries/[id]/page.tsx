import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import {
  inquiryStatusLabels,
  type InquiryStatusInput,
} from '@/lib/validation/inquiry';

import { ReassignControl, StatusControl } from '../_row-actions';
import { InquiryTimeline } from './_timeline';

export const metadata = {
  title: 'Inquiry — Admin',
};

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const dateOnlyFmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

const STATUS_BADGE_TONE: Record<InquiryStatusInput, string> = {
  NEW: 'bg-info/10 text-info border-info/30',
  ASSIGNED: 'bg-info/10 text-info border-info/30',
  IN_PROGRESS: 'bg-accent/10 text-accent border-accent/30',
  AWAITING_PUBLISHER: 'bg-warning/10 text-warning border-warning/30',
  AWAITING_ADVERTISER: 'bg-warning/10 text-warning border-warning/30',
  CONFIRMED: 'bg-success/10 text-success border-success/30',
  LOST: 'bg-danger/10 text-danger border-danger/30',
  CANCELLED: 'bg-surface text-tertiary border-border-subtle',
};

const OPEN_STATUSES: InquiryStatusInput[] = [
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'AWAITING_PUBLISHER',
  'AWAITING_ADVERTISER',
];

function durationLabel(ms: number): string {
  const abs = Math.max(0, ms);
  if (abs < 60_000) return 'just now';
  const min = Math.floor(abs / 60_000);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

interface PageProps {
  params: { id: string };
  searchParams: { order?: string };
}

export default async function AdminInquiryDetailPage({ params, searchParams }: PageProps) {
  await requireAdmin();

  const [inquiry, admins] = await Promise.all([
    prisma.inquiry.findUnique({
      where: { id: params.id },
      include: {
        advertiserCompany: { select: { id: true, name: true, verificationStatus: true } },
        publisherCompany: { select: { id: true, name: true, verificationStatus: true } },
        advertiserUser: { select: { name: true, email: true, phone: true } },
        listing: { select: { id: true, title: true, channelType: true } },
        assignedAdmin: { select: { id: true, name: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!inquiry) notFound();

  const isOpen = OPEN_STATUSES.includes(inquiry.status as InquiryStatusInput);
  const slaLeftMs = inquiry.slaDeadline
    ? inquiry.slaDeadline.getTime() - Date.now()
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-8 py-12">
      <header className="flex flex-col gap-3">
        <Link
          href="/admin/inquiries"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← Queue
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-caption uppercase text-tertiary">
              INQ-{inquiry.id.slice(-8)} · created {dateFmt.format(inquiry.createdAt)}
            </p>
            <h1 className="text-display-md tracking-tight text-primary">
              {inquiry.advertiserCompany.name} → {inquiry.publisherCompany.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center rounded border px-2 py-0.5 text-caption ${STATUS_BADGE_TONE[inquiry.status as InquiryStatusInput]}`}
              >
                {inquiryStatusLabels[inquiry.status as InquiryStatusInput]}
              </span>
              {isOpen && slaLeftMs !== null ? (
                slaLeftMs < 0 ? (
                  <span className="text-caption text-danger">
                    ⚠ SLA breached {durationLabel(-slaLeftMs)} ago
                  </span>
                ) : slaLeftMs < 60 * 60 * 1000 ? (
                  <span className="text-caption text-accent">
                    ⚠ SLA {durationLabel(slaLeftMs)} left
                  </span>
                ) : (
                  <span className="text-caption text-secondary">
                    SLA {durationLabel(slaLeftMs)} left
                  </span>
                )
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ContextCard
          title="Advertiser"
          companyName={inquiry.advertiserCompany.name}
          verification={inquiry.advertiserCompany.verificationStatus}
          extra={
            <>
              <p className="text-caption text-tertiary">{inquiry.advertiserUser.name}</p>
              <p className="text-caption text-tertiary">{inquiry.advertiserUser.email}</p>
              {inquiry.advertiserUser.phone ? (
                <p className="text-caption text-tertiary">{inquiry.advertiserUser.phone}</p>
              ) : null}
            </>
          }
        />
        <ContextCard
          title="Publisher"
          companyName={inquiry.publisherCompany.name}
          verification={inquiry.publisherCompany.verificationStatus}
        />
        <ContextCard
          title="Listing"
          companyName={inquiry.listing?.title ?? '(no specific listing)'}
          extra={
            inquiry.listing ? (
              <p className="text-caption text-tertiary">
                {inquiry.listing.channelType.replace(/_/g, ' ')}
              </p>
            ) : null
          }
        />
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5">
        <h2 className="text-h3 text-primary">Brief</h2>
        {inquiry.campaignGoal ? (
          <p className="whitespace-pre-line text-body text-primary">{inquiry.campaignGoal}</p>
        ) : (
          <p className="text-body text-tertiary">No campaign goal provided.</p>
        )}
        <div className="grid grid-cols-2 gap-4 pt-2 text-body text-primary md:grid-cols-4">
          <FieldRow
            label="Desired from"
            value={
              inquiry.desiredDateFrom ? dateOnlyFmt.format(inquiry.desiredDateFrom) : '—'
            }
          />
          <FieldRow
            label="Desired to"
            value={inquiry.desiredDateTo ? dateOnlyFmt.format(inquiry.desiredDateTo) : '—'}
          />
          <FieldRow
            label="Budget low"
            value={inquiry.budgetRangeLow ? `$${inquiry.budgetRangeLow.toLocaleString()}` : '—'}
          />
          <FieldRow
            label="Budget high"
            value={
              inquiry.budgetRangeHigh ? `$${inquiry.budgetRangeHigh.toLocaleString()}` : '—'
            }
          />
        </div>
        {inquiry.notes ? (
          <div>
            <p className="text-caption uppercase text-tertiary">Additional notes</p>
            <p className="whitespace-pre-line text-body text-secondary">{inquiry.notes}</p>
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-5">
        <h2 className="text-h3 text-primary">Mediation</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-caption uppercase text-tertiary">Assigned admin</span>
            <ReassignControl
              inquiryId={inquiry.id}
              currentAdminId={inquiry.assignedAdminId}
              admins={admins}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-caption uppercase text-tertiary">Change status</span>
            <StatusControl
              inquiryId={inquiry.id}
              currentStatus={inquiry.status as InquiryStatusInput}
            />
          </div>
        </div>
        {isOpen ? (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild>
              <Link href={`/admin/inquiries/${inquiry.id}/close?as=confirmed`}>
                Confirm deal
              </Link>
            </Button>
            <Button asChild variant="destructive">
              <Link href={`/admin/inquiries/${inquiry.id}/close?as=lost`}>Mark Lost</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/admin/inquiries/${inquiry.id}/close?as=cancelled`}>Cancel</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded border border-border-subtle bg-background p-3 text-body text-secondary">
            Closed {inquiry.closedAt ? dateFmt.format(inquiry.closedAt) : ''}{' '}
            {inquiry.closeReason ? `· ${inquiry.closeReason}` : ''}
          </div>
        )}
      </section>

      <InquiryTimeline
        inquiryId={inquiry.id}
        order={searchParams.order === 'asc' ? 'asc' : 'desc'}
      />
    </main>
  );
}

function ContextCard({
  title,
  companyName,
  verification,
  extra,
}: {
  title: string;
  companyName: string;
  verification?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-surface p-4">
      <p className="text-caption uppercase text-tertiary">{title}</p>
      <p className="text-body text-primary">{companyName}</p>
      {verification ? (
        <p className="text-caption text-tertiary">{verification}</p>
      ) : null}
      {extra}
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption uppercase text-tertiary">{label}</span>
      <span>{value}</span>
    </div>
  );
}
