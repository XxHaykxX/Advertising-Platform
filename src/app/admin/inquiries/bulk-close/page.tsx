import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import {
  allowedInquiryTransitions,
  inquiryStatusLabels,
  type InquiryStatusInput,
} from '@/lib/validation/inquiry';

import { BulkCloseForm } from './_form';

export const metadata = {
  title: 'Bulk close inquiries — Admin',
};

const TARGETS = new Set(['CONFIRMED', 'LOST', 'CANCELLED']);

interface PageProps {
  searchParams: { as?: string; ids?: string };
}

export default async function BulkCloseInquiriesPage({ searchParams }: PageProps) {
  await requireAdmin();

  const rawTarget = (searchParams.as ?? '').toUpperCase();
  if (!TARGETS.has(rawTarget)) redirect('/admin/inquiries');
  const target = rawTarget as 'CONFIRMED' | 'LOST' | 'CANCELLED';

  const ids = (searchParams.ids ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!ids.length) redirect('/admin/inquiries');

  const inquiries = await prisma.inquiry.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      status: true,
      advertiserCompany: { select: { name: true } },
      publisherCompany: { select: { name: true } },
    },
  });

  const valid = inquiries.filter((i) =>
    allowedInquiryTransitions[i.status as InquiryStatusInput].includes(target)
  );
  const invalid = inquiries.filter(
    (i) => !allowedInquiryTransitions[i.status as InquiryStatusInput].includes(target)
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-8 py-12">
      <header className="flex flex-col gap-3">
        <Link
          href="/admin/inquiries"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← Cancel and return to queue
        </Link>
        <p className="text-caption uppercase text-tertiary">
          Bulk close · {valid.length} inquir{valid.length === 1 ? 'y' : 'ies'} → {inquiryStatusLabels[target]}
        </p>
        <h1 className="text-display-md tracking-tight text-primary">
          {target === 'CONFIRMED'
            ? 'Confirm deals'
            : target === 'LOST'
              ? 'Mark as Lost'
              : 'Cancel inquiries'}
        </h1>
        {invalid.length ? (
          <p className="text-body text-warning">
            {invalid.length} inquir{invalid.length === 1 ? 'y was' : 'ies were'} already
            terminal or otherwise can&apos;t transition — they&apos;ll be skipped.
          </p>
        ) : null}
      </header>

      <section className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5">
        <h2 className="text-h3 text-primary">Selected</h2>
        <ul className="flex flex-col gap-2">
          {inquiries.map((inq) => {
            const canMove = allowedInquiryTransitions[
              inq.status as InquiryStatusInput
            ].includes(target);
            return (
              <li
                key={inq.id}
                className={`flex flex-col rounded border px-3 py-2 ${
                  canMove
                    ? 'border-border-subtle bg-background'
                    : 'border-warning/30 bg-warning/5 text-tertiary'
                }`}
              >
                <span className="font-mono text-caption text-tertiary">
                  INQ-{inq.id.slice(-8)} ·{' '}
                  {inquiryStatusLabels[inq.status as InquiryStatusInput]}{' '}
                  {canMove ? '' : '(will skip)'}
                </span>
                <span className="text-body text-primary">
                  {inq.advertiserCompany.name} → {inq.publisherCompany.name}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {valid.length ? (
        <BulkCloseForm ids={valid.map((v) => v.id)} target={target} />
      ) : (
        <p className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-body text-danger">
          None of the selected inquiries can move to {target.toLowerCase()}. Go back to
          the queue and pick a different action.
        </p>
      )}
    </main>
  );
}
