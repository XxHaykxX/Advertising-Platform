import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Dashboard — Advertising Platform',
};

interface PageProps {
  searchParams: Promise<{ submitted?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      role: true,
      company: {
        select: {
          id: true,
          name: true,
          verificationStatus: true,
          verificationRequests: {
            orderBy: { submittedAt: 'desc' },
            take: 1,
            select: { decisionReason: true, submittedAt: true },
          },
        },
      },
    },
  });
  if (!user) redirect('/login');
  if (!user.company) redirect('/company-profile');

  const company = user.company;
  const latestRequest = company.verificationRequests[0];
  const params = await searchParams;
  const justSubmitted = params.submitted === 'verification';

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-8 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Dashboard</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          Welcome, {user.name}
        </h1>
        <p className="text-body-lg text-secondary">
          {company.name} · {user.role === 'ADVERTISER' ? 'Advertiser' : 'Publisher'}
        </p>
      </header>

      <VerificationBanner
        status={company.verificationStatus}
        hasRequest={Boolean(latestRequest)}
        rejectionReason={latestRequest?.decisionReason ?? null}
        justSubmitted={justSubmitted}
        role={user.role}
      />

      {user.role === 'PUBLISHER' && company.verificationStatus === 'APPROVED' ? (
        <section className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-6">
          <h2 className="text-h3 text-primary">Listings</h2>
          <p className="text-body text-secondary">
            Manage your inventory — drafts, active slots, paused listings, and
            historical close-outs.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/listings/new">Create a listing</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/listings/mine">My listings</Link>
            </Button>
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-6">
        <h2 className="text-h3 text-primary">What lands next</h2>
        <ul className="flex flex-col gap-2 text-body text-secondary">
          {user.role === 'ADVERTISER' ? (
            <>
              <li>Public catalog (S-01.5) — browse without auth.</li>
              <li>Submit inquiries (E-05) — once your company is verified.</li>
              <li>Wishlist for saved listings (S-05.6).</li>
            </>
          ) : (
            <>
              <li>Public listing detail (S-04.5) — your draft becomes browsable.</li>
              <li>Public catalog (S-01.5).</li>
              <li>Per-inquiry chat (E-07).</li>
            </>
          )}
        </ul>
      </section>

      <div className="flex items-center gap-6 text-body text-secondary">
        <Link
          href="/settings/security"
          className="underline-offset-4 hover:text-primary hover:underline"
        >
          Change password
        </Link>
        <form
          action={async () => {
            'use server';
            const { signOut } = await import('@/auth');
            await signOut({ redirectTo: '/' });
          }}
        >
          <button
            type="submit"
            className="underline-offset-4 hover:text-primary hover:underline"
          >
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}

interface VerificationBannerProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_INFO';
  hasRequest: boolean;
  rejectionReason: string | null;
  justSubmitted: boolean;
  role: 'ADVERTISER' | 'PUBLISHER' | 'ADMIN';
}

function VerificationBanner({
  status,
  hasRequest,
  rejectionReason,
  justSubmitted,
  role,
}: VerificationBannerProps) {
  // Newly-created company, no docs submitted yet.
  if (status === 'PENDING' && !hasRequest) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/10 p-5">
        <p className="text-caption uppercase text-warning">Action required</p>
        <p className="text-body-lg text-primary">
          Submit verification documents so our team can review your company.
        </p>
        <p className="text-body text-secondary">
          Until you&apos;re verified you can browse the catalog but can&apos;t{' '}
          {role === 'ADVERTISER' ? 'submit inquiries' : 'publish listings'}.
        </p>
        <div>
          <Button asChild>
            <Link href="/company-profile/verification">Submit documents</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'PENDING' && hasRequest) {
    return (
      <div className="rounded-lg border border-info/30 bg-info/10 p-5">
        <p className="text-caption uppercase text-info">
          {justSubmitted ? 'Submitted' : 'In review'}
        </p>
        <p className="mt-1 text-body-lg text-primary">
          {justSubmitted
            ? "Got it. We're reviewing your submission — typically within 1 business day."
            : "Our team is reviewing your submission. We'll email you when there's a decision."}
        </p>
      </div>
    );
  }

  if (status === 'NEEDS_INFO') {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/10 p-5">
        <p className="text-caption uppercase text-warning">More info needed</p>
        <p className="text-body-lg text-primary">
          {rejectionReason ?? 'Our team asked for additional documents.'}
        </p>
        <div>
          <Button asChild>
            <Link href="/company-profile/verification">Add documents</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-danger/30 bg-danger/10 p-5">
        <p className="text-caption uppercase text-danger">Verification declined</p>
        <p className="text-body-lg text-primary">
          {rejectionReason ?? 'We couldn\'t verify your company.'}
        </p>
        <div>
          <Button asChild>
            <Link href="/company-profile/verification">Update and resubmit</Link>
          </Button>
        </div>
      </div>
    );
  }

  // APPROVED
  return (
    <div className="rounded-lg border border-accent/30 bg-accent/10 p-5">
      <p className="text-caption uppercase text-accent">Verified</p>
      <p className="mt-1 text-body-lg text-primary">
        You&apos;re cleared to {role === 'ADVERTISER' ? 'submit inquiries' : 'publish listings'}.
        The first one is being built in the next sprint.
      </p>
    </div>
  );
}
