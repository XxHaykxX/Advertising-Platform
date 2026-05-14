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

const OPEN_STATUSES = [
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'AWAITING_PUBLISHER',
  'AWAITING_ADVERTISER',
] as const;

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function durationLabel(ms: number): string {
  const abs = Math.max(0, ms);
  const min = Math.floor(abs / 60_000);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

function ageLabel(d: Date): string {
  return durationLabel(Date.now() - d.getTime());
}

export default async function AdminPage() {
  const admin = await requireAdmin();

  const [
    pendingVerifications,
    openInquiries,
    listingsTotal,
    myQueue,
    unassigned,
  ] = await Promise.all([
    prisma.company.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.inquiry.count({
      where: { status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS'] } },
    }),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.inquiry.findMany({
      where: {
        assignedAdminId: admin.userId,
        status: { in: [...OPEN_STATUSES] },
      },
      orderBy: [{ slaDeadline: 'asc' }, { createdAt: 'asc' }],
      take: 5,
      select: {
        id: true,
        status: true,
        slaDeadline: true,
        createdAt: true,
        advertiserCompany: { select: { name: true } },
        publisherCompany: { select: { name: true } },
      },
    }),
    prisma.inquiry.findMany({
      where: {
        assignedAdminId: null,
        status: { in: ['NEW', 'ASSIGNED'] },
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
      select: {
        id: true,
        status: true,
        slaDeadline: true,
        createdAt: true,
        advertiserCompany: { select: { name: true } },
        publisherCompany: { select: { name: true } },
      },
    }),
  ]);

  const now = Date.now();
  function slaTone(d: Date | null): string {
    if (!d) return 'text-tertiary';
    const ms = d.getTime() - now;
    if (ms < 0) return 'text-danger';
    if (ms < 60 * 60 * 1000) return 'text-accent';
    return 'text-secondary';
  }

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

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5">
          <header className="flex items-center justify-between gap-2">
            <h2 className="text-h3 text-primary">My queue · {myQueue.length}</h2>
            <Link
              href={`/admin/inquiries?assigned=${admin.userId}`}
              className="text-caption text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              View all →
            </Link>
          </header>
          {myQueue.length === 0 ? (
            <p className="text-body text-secondary">
              Nothing assigned to you. Pick from the unassigned queue or wait for a
              triage decision.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {myQueue.map((q) => (
                <li
                  key={q.id}
                  className="flex flex-col gap-1 rounded border border-border-subtle bg-background px-3 py-2"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link
                      href={`/admin/inquiries/${q.id}`}
                      className="font-mono text-caption text-accent underline-offset-4 hover:underline"
                    >
                      INQ-{q.id.slice(-8)}
                    </Link>
                    <span className={`text-caption ${slaTone(q.slaDeadline)}`}>
                      {q.slaDeadline
                        ? q.slaDeadline.getTime() < now
                          ? `⚠ breached ${durationLabel(now - q.slaDeadline.getTime())} ago`
                          : `SLA ${durationLabel(q.slaDeadline.getTime() - now)} left`
                        : '—'}
                    </span>
                  </div>
                  <p className="text-caption text-secondary">
                    {q.advertiserCompany.name} → {q.publisherCompany.name}
                  </p>
                  <p className="text-caption text-tertiary">
                    {q.status.replace(/_/g, ' ')} · created {dateFmt.format(q.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5">
          <header className="flex items-center justify-between gap-2">
            <h2 className="text-h3 text-primary">Unassigned · {unassigned.length}</h2>
            <Link
              href="/admin/inquiries?assigned=unassigned"
              className="text-caption text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              View all →
            </Link>
          </header>
          {unassigned.length === 0 ? (
            <p className="text-body text-secondary">
              Inbox zero. New inquiries land here first.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {unassigned.map((q) => (
                <li
                  key={q.id}
                  className="flex flex-col gap-1 rounded border border-border-subtle bg-background px-3 py-2"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link
                      href={`/admin/inquiries/${q.id}`}
                      className="font-mono text-caption text-accent underline-offset-4 hover:underline"
                    >
                      INQ-{q.id.slice(-8)}
                    </Link>
                    <span className="text-caption text-tertiary">
                      {ageLabel(q.createdAt)} ago
                    </span>
                  </div>
                  <p className="text-caption text-secondary">
                    {q.advertiserCompany.name} → {q.publisherCompany.name}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
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
          <li>
            <Link
              href="/admin/audit"
              className="text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              Audit log →
            </Link>
          </li>
          <li>
            <Link
              href="/admin/featured"
              className="text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              Featured listings →
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
