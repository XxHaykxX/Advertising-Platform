import * as React from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Calendar, MapPin, Users } from 'lucide-react';

import type { Session } from 'next-auth';

import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { channelTypeLabels } from '@/lib/validation/company';
import { WishlistStar } from '@/app/wishlist/_star';

const VIEW_COOKIE = 'viewed_listings';
const VIEW_COOKIE_MAX_BYTES = 3500; // keep well under cookie size limits

export const metadata = {
  title: 'Listing — Advertising Platform',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

interface AudienceJson {
  ageRange?: string | null;
  dailyReach?: number | null;
  region?: string | null;
}

/**
 * Increment viewCount once per session per listing. Stores seen IDs in a
 * cookie (~12 chars each + comma); trimmed when the cookie grows too large.
 */
async function trackView(listingId: string) {
  const store = await cookies();
  const seenRaw = store.get(VIEW_COOKIE)?.value ?? '';
  const seen = seenRaw ? seenRaw.split(',').filter(Boolean) : [];
  if (seen.includes(listingId)) return;

  await prisma.listing.update({
    where: { id: listingId },
    data: { viewCount: { increment: 1 } },
  });

  const next = [...seen, listingId];
  let serialised = next.join(',');
  while (serialised.length > VIEW_COOKIE_MAX_BYTES && next.length > 1) {
    next.shift();
    serialised = next.join(',');
  }
  store.set(VIEW_COOKIE, serialised, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      channelType: true,
      status: true,
      availableFrom: true,
      availableTo: true,
      audienceDemographics: true,
      company: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          verificationStatus: true,
        },
      },
      sourceChannel: { select: { name: true } },
    },
  });

  if (!listing || listing.status !== 'ACTIVE') notFound();

  // Fire-and-forget view count (won't block render).
  trackView(listing.id).catch(() => {
    /* swallow — view tracking is best-effort */
  });

  const audience = (listing.audienceDemographics ?? {}) as AudienceJson;
  const session = (await auth()) as Session | null;
  const cta = await resolveInquiryCTA(session);

  // Star is rendered only for advertisers — anyone else doesn't have a
  // wishlist concept. Verification is NOT required for wishlist (per AC).
  let isSaved = false;
  let canWishlist = false;
  if (session?.user) {
    const viewer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (viewer?.role === 'ADVERTISER') {
      canWishlist = true;
      const existing = await prisma.wishlistItem.findUnique({
        where: { userId_listingId: { userId: session.user.id, listingId: listing.id } },
      });
      isSaved = Boolean(existing);
    }
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-12">
      <div>
        <Link
          href="/catalog"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← Back to catalog
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <p className="text-caption uppercase text-tertiary">
          {channelTypeLabels[listing.channelType as keyof typeof channelTypeLabels]}
          {listing.sourceChannel ? ` · ${listing.sourceChannel.name}` : ''}
        </p>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-display-lg tracking-tight text-primary">
            {listing.title}
          </h1>
          {canWishlist ? (
            <WishlistStar
              listingId={listing.id}
              isSaved={isSaved}
              className="shrink-0"
            />
          ) : null}
        </div>
        <p className="text-body-lg text-secondary">
          By <span className="text-primary">{listing.company.name}</span>
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-6">
        <h2 className="text-h3 text-primary">Availability</h2>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-body text-secondary">
          <p className="inline-flex items-center gap-2">
            <Calendar size={16} className="text-tertiary" />
            {listing.availableFrom.toISOString().slice(0, 10)} →{' '}
            {listing.availableTo.toISOString().slice(0, 10)}
          </p>
          {audience.region ? (
            <p className="inline-flex items-center gap-2">
              <MapPin size={16} className="text-tertiary" />
              {audience.region}
            </p>
          ) : null}
          {audience.dailyReach ? (
            <p className="inline-flex items-center gap-2">
              <Users size={16} className="text-tertiary" />~
              {audience.dailyReach.toLocaleString('en-US')} daily
              {audience.ageRange ? ` · ${audience.ageRange}` : ''}
            </p>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-h3 text-primary">About this slot</h2>
        <p className="whitespace-pre-line text-body-lg text-secondary">
          {listing.description}
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-accent/30 bg-accent/10 p-6">
        <h2 className="text-h3 text-primary">Interested?</h2>
        <p className="text-body text-primary">{cta.message}</p>
        <div>
          {cta.href ? (
            <Button asChild>
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          ) : (
            <Button disabled>{cta.label}</Button>
          )}
        </div>
        <p className="text-caption text-tertiary">
          We broker the conversation — you talk to our team, our team talks to{' '}
          {listing.company.name}.
        </p>
      </section>
    </main>
  );
}

async function resolveInquiryCTA(session: Session | null) {
  if (!session?.user) {
    return {
      message:
        'Create an account to send an inquiry. Browsing the catalog is free.',
      label: 'Register to inquire',
      href: '/register',
    };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      company: { select: { canAdvertise: true } },
    },
  });
  if (!user) redirect('/login');
  if (user.role !== 'ADVERTISER') {
    return {
      message: 'Inquiries are sent by advertisers. Publishers list inventory instead.',
      label: 'Manage listings',
      href: '/listings/mine',
    };
  }
  if (!user.company?.canAdvertise) {
    return {
      message:
        'Your company is pending verification. You can inquire once our team has approved you.',
      label: 'Pending verification',
      href: null as string | null,
    };
  }
  return {
    message: 'Send an inquiry and our team will get back within 4 business hours.',
    label: 'Request information',
    // S-05.1 lands the actual /inquiries/new route; for now the CTA is a placeholder.
    href: '/dashboard',
  };
}
