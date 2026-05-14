import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Calendar, MapPin, Users } from 'lucide-react';

import type { Session } from 'next-auth';

import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import {
  channelTypeLabels,
  type ChannelTypeInput,
} from '@/lib/validation/company';

export const metadata = {
  title: 'Publisher — Advertising Platform',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublisherProfilePage({ params }: PageProps) {
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      legalName: true,
      country: true,
      address: true,
      logoUrl: true,
      foundingYear: true,
      verificationStatus: true,
      canPublish: true,
      industries: { select: { industry: { select: { name: true } } } },
    },
  });

  // Only verified publishers get a public profile. Anything else 404 —
  // unverified companies aren't a public-facing concept.
  if (!company || !company.canPublish || company.verificationStatus !== 'APPROVED') {
    notFound();
  }

  const listings = await prisma.listing.findMany({
    where: { companyId: company.id, status: 'ACTIVE' },
    orderBy: { availableFrom: 'asc' },
    select: {
      id: true,
      title: true,
      channelType: true,
      availableFrom: true,
      availableTo: true,
      audienceDemographics: true,
      sourceChannel: { select: { name: true } },
    },
  });

  const session = (await auth()) as Session | null;
  const cta = await resolveInquiryCTA(session, company.id);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
      <div>
        <Link
          href="/catalog"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← Back to catalog
        </Link>
      </div>

      <header className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {company.logoUrl ? (
            <Image
              src={company.logoUrl}
              width={80}
              height={80}
              alt={`${company.name} logo`}
              className="rounded-lg border border-border-subtle bg-background"
              unoptimized
            />
          ) : null}
          <div className="flex flex-col gap-1">
            <p className="text-caption uppercase text-tertiary">Publisher</p>
            <h1 className="text-display-lg tracking-tight text-primary">
              {company.name}
            </h1>
            <p className="text-body text-secondary">
              {company.country}
              {company.foundingYear ? ` · est. ${company.foundingYear}` : ''}
              {company.industries.length
                ? ` · ${company.industries.map((i) => i.industry.name).join(', ')}`
                : ''}
            </p>
          </div>
        </div>
        {cta.href ? (
          <Button asChild>
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        ) : (
          <Button disabled>{cta.label}</Button>
        )}
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 text-primary">
          Available inventory ({listings.length})
        </h2>
        {listings.length === 0 ? (
          <p className="rounded-lg border border-border-subtle bg-surface p-6 text-body text-secondary">
            No active listings right now. Send a general inquiry — our team will
            check what they have coming up.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {listings.map((l) => {
              const audience = (l.audienceDemographics ?? {}) as {
                ageRange?: string | null;
                dailyReach?: number | null;
                region?: string | null;
              };
              return (
                <li key={l.id}>
                  <Link
                    href={`/catalog/listings/${l.id}`}
                    className="flex h-full flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5 transition-colors duration-200 ease-out-expo hover:border-border-strong hover:bg-surface-elevated"
                  >
                    <p className="text-caption uppercase text-tertiary">
                      {channelTypeLabels[l.channelType as ChannelTypeInput]}
                      {l.sourceChannel ? ` · ${l.sourceChannel.name}` : ''}
                    </p>
                    <h3 className="text-h3 text-primary">{l.title}</h3>
                    <p className="inline-flex items-center gap-2 text-caption text-tertiary">
                      <Calendar size={14} />
                      {l.availableFrom.toISOString().slice(0, 10)} →{' '}
                      {l.availableTo.toISOString().slice(0, 10)}
                    </p>
                    {audience.region ? (
                      <p className="inline-flex items-center gap-2 text-caption text-tertiary">
                        <MapPin size={14} />
                        {audience.region}
                      </p>
                    ) : null}
                    {audience.dailyReach ? (
                      <p className="inline-flex items-center gap-2 text-caption text-tertiary">
                        <Users size={14} />~
                        {audience.dailyReach.toLocaleString('en-US')} daily
                      </p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-accent/30 bg-accent/10 p-6">
        <h2 className="text-h3 text-primary">Not seeing what you need?</h2>
        <p className="text-body text-primary">
          Send a general inquiry. Our team will ask {company.name} about
          upcoming slots and get back to you.
        </p>
        {cta.href ? (
          <Button asChild>
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        ) : (
          <Button disabled>{cta.label}</Button>
        )}
      </section>
    </main>
  );
}

async function resolveInquiryCTA(
  session: Session | null,
  publisherCompanyId: string
) {
  if (!session?.user) {
    return {
      label: 'Register to inquire',
      href: '/register' as string | null,
    };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, company: { select: { canAdvertise: true } } },
  });
  if (!user) redirect('/login');
  if (user.role !== 'ADVERTISER') {
    return { label: 'Sign in as advertiser', href: null as string | null };
  }
  if (!user.company?.canAdvertise) {
    return {
      label: 'Pending verification',
      href: null as string | null,
    };
  }
  return {
    label: 'Send a general inquiry',
    href: `/inquiries/new?publisherCompanyId=${publisherCompanyId}` as string | null,
  };
}
