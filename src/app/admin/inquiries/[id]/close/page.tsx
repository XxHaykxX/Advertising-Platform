import * as React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import {
  allowedInquiryTransitions,
  inquiryStatusLabels,
  type InquiryStatusInput,
} from '@/lib/validation/inquiry';

import { CloseForm } from './_form';

export const metadata = {
  title: 'Close inquiry — Admin',
};

const TARGETS = new Set(['CONFIRMED', 'LOST', 'CANCELLED']);

interface PageProps {
  params: { id: string };
  searchParams: { as?: string };
}

export default async function CloseInquiryPage({ params, searchParams }: PageProps) {
  await requireAdmin();

  const rawTarget = (searchParams.as ?? '').toUpperCase();
  if (!TARGETS.has(rawTarget)) redirect('/admin/inquiries');
  const target = rawTarget as 'CONFIRMED' | 'LOST' | 'CANCELLED';

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      status: true,
      campaignGoal: true,
      advertiserCompany: { select: { name: true } },
      publisherCompany: { select: { name: true } },
      listing: { select: { title: true, channelType: true } },
    },
  });
  if (!inquiry) notFound();

  const canTransition = allowedInquiryTransitions[inquiry.status as InquiryStatusInput].includes(
    target
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-8 py-12">
      <header className="flex flex-col gap-3">
        <Link
          href="/admin/inquiries"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← Back to queue
        </Link>
        <p className="text-caption uppercase text-tertiary">
          INQ-{inquiry.id.slice(-8)} · {inquiryStatusLabels[inquiry.status as InquiryStatusInput]} →{' '}
          {inquiryStatusLabels[target]}
        </p>
        <h1 className="text-display-md tracking-tight text-primary">
          {target === 'CONFIRMED'
            ? 'Confirm deal'
            : target === 'LOST'
              ? 'Mark as Lost'
              : 'Cancel inquiry'}
        </h1>
      </header>

      <section className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface p-5">
        <p className="text-caption uppercase text-tertiary">Context</p>
        <p className="text-body text-primary">
          {inquiry.advertiserCompany.name}{' '}
          <span className="text-tertiary">→</span> {inquiry.publisherCompany.name}
        </p>
        {inquiry.listing ? (
          <p className="text-caption text-tertiary">
            {inquiry.listing.title} · {inquiry.listing.channelType.replace(/_/g, ' ')}
          </p>
        ) : (
          <p className="text-caption text-tertiary">No specific listing</p>
        )}
        {inquiry.campaignGoal ? (
          <p className="text-body text-secondary">{inquiry.campaignGoal}</p>
        ) : null}
      </section>

      {!canTransition ? (
        <section className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-body text-danger">
          A {inquiry.status.toLowerCase().replace('_', ' ')} inquiry cannot move to{' '}
          {target.toLowerCase()}. Reopen or pick a valid transition from the queue.
        </section>
      ) : (
        <CloseForm inquiryId={inquiry.id} target={target} />
      )}
    </main>
  );
}
