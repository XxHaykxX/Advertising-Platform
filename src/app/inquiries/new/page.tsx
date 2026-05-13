import * as React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { channelTypeLabels } from '@/lib/validation/company';

import { InquiryForm } from './_form';

export const metadata = {
  title: 'Submit inquiry — Advertising Platform',
};

interface PageProps {
  searchParams: Promise<{ listingId?: string; publisherCompanyId?: string }>;
}

export default async function NewInquiryPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      company: { select: { id: true, canAdvertise: true } },
    },
  });
  if (!user) redirect('/login');
  if (!user.company) redirect('/company-profile');
  if (user.role !== 'ADVERTISER') redirect('/dashboard');
  if (!user.company.canAdvertise) redirect('/dashboard');

  const params = await searchParams;
  const listingId = params.listingId?.trim();
  const explicitPublisher = params.publisherCompanyId?.trim();

  if (!listingId && !explicitPublisher) {
    notFound();
  }

  let listing: {
    id: string;
    title: string;
    channelType: string;
    company: { id: string; name: string };
  } | null = null;
  let publisherCompanyId: string | null = null;
  let publisherName = '';

  if (listingId) {
    const found = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        channelType: true,
        status: true,
        company: { select: { id: true, name: true } },
      },
    });
    if (!found || found.status !== 'ACTIVE') notFound();
    listing = found;
    publisherCompanyId = found.company.id;
    publisherName = found.company.name;
  } else if (explicitPublisher) {
    const publisher = await prisma.company.findUnique({
      where: { id: explicitPublisher },
      select: { id: true, name: true, canPublish: true },
    });
    if (!publisher || !publisher.canPublish) notFound();
    publisherCompanyId = publisher.id;
    publisherName = publisher.name;
  }

  if (!publisherCompanyId) notFound();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <Link
        href={listing ? `/catalog/listings/${listing.id}` : '/catalog'}
        className="inline-flex w-fit items-center gap-1 text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
      >
        <ArrowLeft size={14} /> {listing ? 'Back to listing' : 'Back to catalog'}
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">New inquiry</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          Tell us what you want to run
        </h1>
        {listing ? (
          <p className="text-body-lg text-secondary">
            About{' '}
            <span className="text-primary">{listing.title}</span> ·{' '}
            {channelTypeLabels[listing.channelType as keyof typeof channelTypeLabels]} ·{' '}
            {publisherName}
          </p>
        ) : (
          <p className="text-body-lg text-secondary">
            For <span className="text-primary">{publisherName}</span>. General
            inquiry — not tied to a specific listing.
          </p>
        )}
      </header>

      <InquiryForm
        listingId={listing?.id}
        publisherCompanyId={publisherCompanyId}
      />
    </main>
  );
}
