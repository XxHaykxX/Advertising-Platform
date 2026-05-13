import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

import { VerificationForm } from './_form';

export const metadata = {
  title: 'Verify your company — Advertising Platform',
};

export default async function CompanyVerificationPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      company: {
        select: {
          id: true,
          name: true,
          verificationStatus: true,
          verificationRequests: {
            orderBy: { submittedAt: 'desc' },
            take: 1,
            select: { decision: true, decisionReason: true, submittedAt: true },
          },
        },
      },
    },
  });
  if (!user?.company) redirect('/company-profile');

  const company = user.company;
  const latest = company.verificationRequests[0];

  if (company.verificationStatus === 'APPROVED') {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-2">
          <p className="text-caption uppercase text-accent">Approved</p>
          <h1 className="text-display-lg tracking-tight text-primary">
            {company.name} is verified
          </h1>
          <p className="text-body-lg text-secondary">
            Nothing more to do here. Head back to your cabinet.
          </p>
        </header>
        <Link
          href="/dashboard"
          className="inline-flex h-12 w-fit items-center justify-center rounded bg-accent px-6 text-body-lg font-medium text-accent-on hover:bg-accent/90"
        >
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Verification</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          {latest ? 'Resubmit verification' : 'Submit for verification'}
        </h1>
        <p className="text-body-lg text-secondary">
          Upload registration documents, tax certificates, or anything else that
          confirms <span className="text-primary">{company.name}</span> exists.
          Our team reviews within 1 business day.
        </p>
      </header>

      {latest?.decision === 'REJECTED' && latest.decisionReason ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-4">
          <p className="text-caption uppercase text-danger">Previous review</p>
          <p className="mt-1 text-body text-primary">{latest.decisionReason}</p>
        </div>
      ) : null}

      <VerificationForm />
    </main>
  );
}
