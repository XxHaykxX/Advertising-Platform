import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

import { EditCompanyForm } from './_form';

export const metadata = {
  title: 'Company profile — Settings',
};

export default async function SettingsCompanyPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      company: {
        select: {
          id: true,
          name: true,
          legalName: true,
          taxId: true,
          foundingYear: true,
          country: true,
          address: true,
          logoUrl: true,
          channelsOfInterest: true,
          verificationStatus: true,
          industries: { select: { industryId: true } },
        },
      },
    },
  });
  if (!user) redirect('/login');
  if (!user.company) redirect('/company-profile');
  if (user.role === 'ADMIN') redirect('/admin');

  const industries = await prisma.industry.findMany({
    where: { archived: false },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const selectedChannels = Array.isArray(user.company.channelsOfInterest)
    ? (user.company.channelsOfInterest as string[])
    : [];

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← Dashboard
        </Link>
        <p className="text-caption uppercase text-tertiary">Settings · Company</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          {user.company.name}
        </h1>
        <p className="text-body-lg text-secondary">
          Status: <span className="text-primary">{user.company.verificationStatus}</span>.
          Edits here update your public profile. Identity-field changes (legal name,
          tax ID) ping the admin team so they can double-check.
        </p>
      </header>

      <EditCompanyForm
        role={user.role === 'ADVERTISER' ? 'ADVERTISER' : 'PUBLISHER'}
        industries={industries}
        defaults={{
          name: user.company.name,
          legalName: user.company.legalName,
          taxId: user.company.taxId,
          foundingYear: user.company.foundingYear,
          country: user.company.country,
          address: user.company.address,
          logoUrl: user.company.logoUrl,
          selectedIndustryIds: user.company.industries.map((i) => i.industryId),
          channelsOfInterest: selectedChannels,
        }}
      />
    </main>
  );
}
