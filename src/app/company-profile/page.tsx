import * as React from 'react';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

import { CompanyProfileForm } from './_form';

export const metadata = {
  title: 'Company profile — Advertising Platform',
};

export default async function CompanyProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, companyId: true, emailVerified: true },
  });
  if (!user) redirect('/login');
  if (!user.emailVerified) redirect('/verify');
  if (user.companyId) redirect('/dashboard');

  const industries = await prisma.industry.findMany({
    where: { archived: false },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">
          Step 3 of 3 · Final step
        </p>
        <h1 className="text-display-lg tracking-tight text-primary">
          Tell us about your company
        </h1>
        <p className="text-body-lg text-secondary">
          Our team verifies every company before they can{' '}
          {user.role === 'ADVERTISER' ? 'submit inquiries' : 'publish listings'}.
          We typically respond within 1 business day.
        </p>
      </header>

      <CompanyProfileForm
        role={user.role === 'ADVERTISER' ? 'ADVERTISER' : 'PUBLISHER'}
        industries={industries}
      />
    </main>
  );
}
