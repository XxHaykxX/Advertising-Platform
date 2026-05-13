import * as React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  inquiryStatusLabels,
  type InquiryStatusInput,
} from '@/lib/validation/inquiry';

import { CancelInquiryButton } from './_cancel-button';

export const metadata = {
  title: 'Inquiry — Advertising Platform',
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ just?: string }>;
}

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

const cancellableStatuses: InquiryStatusInput[] = ['NEW', 'ASSIGNED'];

export default async function InquiryDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { just } = await searchParams;

  const session = await auth();
  if (!session?.user) redirect('/login');

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      campaignGoal: true,
      desiredDateFrom: true,
      desiredDateTo: true,
      budgetRangeLow: true,
      budgetRangeHigh: true,
      notes: true,
      slaDeadline: true,
      createdAt: true,
      updatedAt: true,
      closedAt: true,
      advertiserUserId: true,
      publisherCompany: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true } },
      auditEntries: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          action: true,
          note: true,
          createdAt: true,
        },
      },
    },
  });
  if (!inquiry) notFound();
  if (inquiry.advertiserUserId !== session.user.id) notFound();

  const status = inquiry.status as InquiryStatusInput;
  const isJustSubmitted = just === '1';
  const canCancel = cancellableStatuses.includes(status);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <Link
        href="/inquiries"
        className="inline-flex w-fit items-center gap-1 text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
      >
        <ArrowLeft size={14} /> All inquiries
      </Link>

      {isJustSubmitted ? (
        <p className="rounded border border-accent/30 bg-accent/10 p-3 text-body text-primary">
          Inquiry submitted. We&apos;ll be in touch within 4 business hours.
        </p>
      ) : null}

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full border px-3 py-1 text-caption uppercase ${statusStyles[status]}`}
          >
            {inquiryStatusLabels[status]}
          </span>
          <span className="text-caption text-tertiary">
            Inquiry #{inquiry.id.slice(-8).toUpperCase()}
          </span>
        </div>
        <h1 className="text-display-lg tracking-tight text-primary">
          {inquiry.listing?.title ??
            `${inquiry.publisherCompany.name} — general inquiry`}
        </h1>
        <p className="text-body-lg text-secondary">
          To <span className="text-primary">{inquiry.publisherCompany.name}</span>
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoBlock label="Submitted">
          {inquiry.createdAt.toISOString().slice(0, 10)}
        </InfoBlock>
        {inquiry.slaDeadline && status === 'NEW' ? (
          <InfoBlock label="Our SLA">
            Response by{' '}
            {inquiry.slaDeadline.toISOString().replace('T', ' ').slice(0, 16)}
          </InfoBlock>
        ) : null}
        {inquiry.desiredDateFrom && inquiry.desiredDateTo ? (
          <InfoBlock label="Desired run">
            {inquiry.desiredDateFrom.toISOString().slice(0, 10)} →{' '}
            {inquiry.desiredDateTo.toISOString().slice(0, 10)}
          </InfoBlock>
        ) : null}
        {inquiry.budgetRangeLow !== null || inquiry.budgetRangeHigh !== null ? (
          <InfoBlock label="Budget (private)">
            {formatBudget(inquiry.budgetRangeLow, inquiry.budgetRangeHigh)}
          </InfoBlock>
        ) : null}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5">
        <h2 className="text-h3 text-primary">Campaign goal</h2>
        <p className="whitespace-pre-line text-body text-secondary">
          {inquiry.campaignGoal ?? '—'}
        </p>
      </section>

      {inquiry.notes ? (
        <section className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5">
          <h2 className="text-h3 text-primary">Notes you added</h2>
          <p className="whitespace-pre-line text-body text-secondary">
            {inquiry.notes}
          </p>
        </section>
      ) : null}

      <section className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5">
        <h2 className="text-h3 text-primary">Timeline</h2>
        <ol className="flex flex-col gap-3">
          {inquiry.auditEntries.map((entry) => (
            <li key={entry.id} className="flex items-baseline gap-3">
              <span className="font-mono text-caption text-tertiary">
                {entry.createdAt.toISOString().replace('T', ' ').slice(0, 16)}
              </span>
              <span className="text-body text-secondary">
                {humanAction(entry.action, entry.fromStatus, entry.toStatus)}
                {entry.note ? ` — ${entry.note}` : ''}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-info/30 bg-info/10 p-5">
        <h2 className="text-h3 text-primary">Chat</h2>
        <p className="text-body text-secondary">
          The chat panel lives here when E-07 ships — a side-by-side widget
          where you and our team work the inquiry. For now, our team will
          email you for any back-and-forth.
        </p>
      </section>

      {canCancel ? <CancelInquiryButton inquiryId={inquiry.id} /> : null}
    </main>
  );
}

function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-4">
      <p className="text-caption uppercase text-tertiary">{label}</p>
      <p className="mt-1 text-body text-primary">{children}</p>
    </div>
  );
}

function formatBudget(low: number | null, high: number | null): string {
  if (low !== null && high !== null) {
    return `$${low.toLocaleString('en-US')} – $${high.toLocaleString('en-US')}`;
  }
  if (low !== null) return `From $${low.toLocaleString('en-US')}`;
  if (high !== null) return `Up to $${high.toLocaleString('en-US')}`;
  return '—';
}

function humanAction(
  action: string,
  from: InquiryStatusInput | null,
  to: InquiryStatusInput | null
): string {
  if (action === 'SUBMITTED') return 'Inquiry submitted';
  if (action === 'ADVERTISER_CANCELLED') return 'Inquiry cancelled by you';
  if (from && to) {
    return `Status: ${inquiryStatusLabels[from]} → ${inquiryStatusLabels[to]}`;
  }
  if (to) return `Status: ${inquiryStatusLabels[to]}`;
  return action;
}
