import * as React from 'react';
import Link from 'next/link';

import { AnnouncementBanner } from '@/components/announcement-banner';
import { NotificationBell } from '@/components/notification-bell';
import { prisma } from '@/lib/prisma';
import { adminMfaDisabled, requireAdmin } from '@/lib/admin-guard';

import { signOutAdmin } from './_actions';

export const metadata = {
  title: 'Admin — Advertising Platform',
};

export default async function AdminPage() {
  const admin = await requireAdmin();

  const [pendingVerifications, openInquiries, listingsTotal] = await Promise.all([
    prisma.company.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.inquiry.count({
      where: { status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS'] } },
    }),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-8 py-16">
      <AnnouncementBanner />
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-caption uppercase text-tertiary">Super Admin</p>
          <h1 className="text-display-lg tracking-tight text-primary">
            Welcome, {admin.name}
          </h1>
          <p className="text-body-lg text-secondary">
            {adminMfaDisabled
              ? 'Two-factor gate is OFF (DISABLE_ADMIN_2FA=true — dev only). Verification queue and inquiry queue are live.'
              : 'Two-factor session is active. Verification queue and inquiry queue are live; admin override on listings, bulk actions, and team management are still to come.'}
          </p>
        </div>
        <NotificationBell />
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Pending verifications"
          value={pendingVerifications}
          href="/admin/verifications"
        />
        <StatCard
          label="Open inquiries"
          value={openInquiries}
          href="/admin/inquiries"
        />
        <StatCard
          label="Active listings"
          value={listingsTotal}
          href="/admin/listings?status=ACTIVE"
        />
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface p-5">
        <h2 className="text-h3 text-primary">Settings</h2>
        <ul className="flex flex-col gap-1 text-body">
          <li>
            <Link
              href="/admin/taxonomy/industries"
              className="text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              Taxonomy · Industries →
            </Link>
          </li>
          <li>
            <Link
              href="/admin/team"
              className="text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              Admin team →
            </Link>
          </li>
          <li>
            <Link
              href="/admin/users"
              className="text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              Users →
            </Link>
          </li>
          <li>
            <Link
              href="/admin/companies"
              className="text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              Companies →
            </Link>
          </li>
          <li>
            <Link
              href="/admin/analytics"
              className="text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              Platform analytics →
            </Link>
          </li>
          <li>
            <Link
              href="/admin/announcements"
              className="text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              Announcements →
            </Link>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-info/30 bg-info/10 p-5">
        <h2 className="text-h3 text-primary">Coming up</h2>
        <ul className="flex flex-col gap-1 text-body text-secondary">
          <li>S-09.4 bulk actions (assign / close many at once).</li>
          <li>S-09.5 inquiry detail split-pane (blocked on chat provider — E-07).</li>
          <li>S-09.7–10 close-with-reason modal, internal notes, call log, activity timeline.</li>
          <li>S-04.6 admin override on listings.</li>
          <li>S-10.2/3/4 user + company + admin-team management.</li>
          <li>S-12.x generic audit log (today the decision audit lives on each VerificationRequest).</li>
        </ul>
      </section>

      <div className="flex items-center gap-6 text-body text-secondary">
        <Link
          href="/settings/security"
          className="underline-offset-4 hover:text-primary hover:underline"
        >
          Change password
        </Link>
        <form action={signOutAdmin}>
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

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-caption uppercase text-tertiary">{label}</p>
      <p className="text-display-lg text-primary">{value}</p>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-surface p-5 transition hover:border-accent/40 hover:bg-surface-elevated"
      >
        {content}
      </Link>
    );
  }
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-surface p-5">
      {content}
    </div>
  );
}
