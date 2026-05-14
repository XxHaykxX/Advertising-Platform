import * as React from 'react';
import Link from 'next/link';

import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import type { InquiryStatus, Prisma } from '@prisma/client';

export const metadata = {
  title: 'Analytics — Admin',
};

function asString(v: string | string[] | undefined): string {
  if (!v) return '';
  return Array.isArray(v) ? (v[0] ?? '') : v;
}

function parseDateOnly(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

const dayMs = 24 * 60 * 60 * 1000;
const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  await requireAdmin();

  const fromRaw = asString(searchParams.from);
  const toRaw = asString(searchParams.to);
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * dayMs);

  const fromDate = parseDateOnly(fromRaw) ?? defaultFrom;
  const toDate = parseDateOnly(toRaw) ?? now;
  const toEnd = new Date(toDate.getTime() + dayMs - 1);

  const range: Prisma.DateTimeFilter = {
    gte: fromDate,
    lte: toEnd,
  };

  // ─── Signups ──────────────────────────────────────────────────────────
  const [usersTotal, usersAdvertisers, usersPublishers, usersAdmins] =
    await prisma.$transaction([
      prisma.user.count({ where: { createdAt: range } }),
      prisma.user.count({ where: { createdAt: range, role: 'ADVERTISER' } }),
      prisma.user.count({ where: { createdAt: range, role: 'PUBLISHER' } }),
      prisma.user.count({ where: { createdAt: range, role: 'ADMIN' } }),
    ]);

  // ─── Companies / Verification funnel ──────────────────────────────────
  const [
    companiesNew,
    companiesPending,
    companiesApproved,
    companiesRejected,
    companiesNeedsInfo,
  ] = await prisma.$transaction([
    prisma.company.count({ where: { createdAt: range } }),
    prisma.company.count({ where: { createdAt: range, verificationStatus: 'PENDING' } }),
    prisma.company.count({ where: { createdAt: range, verificationStatus: 'APPROVED' } }),
    prisma.company.count({ where: { createdAt: range, verificationStatus: 'REJECTED' } }),
    prisma.company.count({
      where: { createdAt: range, verificationStatus: 'NEEDS_INFO' },
    }),
  ]);

  // Time-to-verify (median) — pull verifiedAt - createdAt for approved
  // companies in range.
  const approvedTimings = await prisma.company.findMany({
    where: {
      verificationStatus: 'APPROVED',
      verifiedAt: { not: null, gte: fromDate, lte: toEnd },
    },
    select: { createdAt: true, verifiedAt: true },
  });
  const verifyHours = approvedTimings
    .map((c) =>
      c.verifiedAt ? (c.verifiedAt.getTime() - c.createdAt.getTime()) / 3_600_000 : 0
    )
    .filter((h) => h >= 0);
  const medianTimeToVerifyH = median(verifyHours);

  // ─── Inquiries ───────────────────────────────────────────────────────
  const inquiryStatusBuckets = await prisma.inquiry.groupBy({
    by: ['status'],
    _count: { _all: true },
    where: { createdAt: range },
  });
  const inquiryTotals: Record<InquiryStatus, number> = {
    NEW: 0,
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    AWAITING_PUBLISHER: 0,
    AWAITING_ADVERTISER: 0,
    CONFIRMED: 0,
    LOST: 0,
    CANCELLED: 0,
  };
  for (const row of inquiryStatusBuckets) {
    inquiryTotals[row.status as InquiryStatus] = row._count._all;
  }
  const inquiryTotal = Object.values(inquiryTotals).reduce((a, b) => a + b, 0);
  const inquiryClosed =
    inquiryTotals.CONFIRMED + inquiryTotals.LOST + inquiryTotals.CANCELLED;
  const conversionPct =
    inquiryClosed > 0
      ? Math.round((inquiryTotals.CONFIRMED / inquiryClosed) * 100)
      : 0;

  // ─── Listings ────────────────────────────────────────────────────────
  const listingBuckets = await prisma.listing.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const listingsByStatus = Object.fromEntries(
    listingBuckets.map((b) => [b.status, b._count._all])
  );

  // ─── Top publishers (by confirmed deals in range) ────────────────────
  const topPublishersRaw = await prisma.inquiry.groupBy({
    by: ['publisherCompanyId'],
    _count: { _all: true },
    where: { createdAt: range, status: 'CONFIRMED' },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });
  const publisherNames = topPublishersRaw.length
    ? await prisma.company.findMany({
        where: { id: { in: topPublishersRaw.map((p) => p.publisherCompanyId) } },
        select: { id: true, name: true },
      })
    : [];
  const publisherNameById = new Map(publisherNames.map((p) => [p.id, p.name]));

  // ─── Top advertisers (by inquiries submitted in range) ───────────────
  const topAdvertisersRaw = await prisma.inquiry.groupBy({
    by: ['advertiserCompanyId'],
    _count: { _all: true },
    where: { createdAt: range },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });
  const advertiserNames = topAdvertisersRaw.length
    ? await prisma.company.findMany({
        where: { id: { in: topAdvertisersRaw.map((a) => a.advertiserCompanyId) } },
        select: { id: true, name: true },
      })
    : [];
  const advertiserNameById = new Map(advertiserNames.map((a) => [a.id, a.name]));

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-8 py-12">
      <header className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-caption uppercase text-tertiary">Super Admin · Analytics</p>
          <h1 className="text-display-md tracking-tight text-primary">Platform health</h1>
          <p className="text-body text-secondary">
            Snapshot for{' '}
            <span className="text-primary">
              {dateFmt.format(fromDate)} → {dateFmt.format(toDate)}
            </span>
            . Default window is the last 30 days.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← Admin home
        </Link>
      </header>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border-subtle bg-surface p-5"
      >
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">From</span>
          <input
            type="date"
            name="from"
            defaultValue={isoDate(fromDate)}
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">To</span>
          <input
            type="date"
            name="to"
            defaultValue={isoDate(toDate)}
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded bg-accent px-4 text-body font-medium text-accent-on transition hover:bg-accent/90 motion-safe:hover:-translate-y-1 hover:shadow-md hover:shadow-accent/20"
        >
          Apply
        </button>
        {fromRaw || toRaw ? (
          <Link
            href="/admin/analytics"
            className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
          >
            Reset to last 30 days
          </Link>
        ) : null}
      </form>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tile label="New signups" value={usersTotal} />
        <Tile label="Advertisers" value={usersAdvertisers} />
        <Tile label="Publishers" value={usersPublishers} />
        <Tile label="New admins" value={usersAdmins} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Inquiries">
          <Row label="Submitted total" value={inquiryTotal} />
          <Row label="Open" value={inquiryTotals.NEW + inquiryTotals.ASSIGNED + inquiryTotals.IN_PROGRESS} />
          <Row
            label="Awaiting"
            value={inquiryTotals.AWAITING_PUBLISHER + inquiryTotals.AWAITING_ADVERTISER}
          />
          <Row label="Confirmed" value={inquiryTotals.CONFIRMED} tone="success" />
          <Row label="Lost" value={inquiryTotals.LOST} tone="danger" />
          <Row label="Cancelled" value={inquiryTotals.CANCELLED} tone="tertiary" />
          <div className="border-t border-border-subtle pt-2">
            <Row
              label="Conversion (confirmed / closed)"
              value={`${conversionPct}%`}
              tone={
                conversionPct >= 40 ? 'success' : conversionPct >= 20 ? 'warning' : 'danger'
              }
            />
          </div>
        </Card>

        <Card title="Companies & verification">
          <Row label="New companies" value={companiesNew} />
          <Row label="Pending review" value={companiesPending} tone="info" />
          <Row label="Approved" value={companiesApproved} tone="success" />
          <Row label="Rejected" value={companiesRejected} tone="danger" />
          <Row label="Needs more info" value={companiesNeedsInfo} tone="warning" />
          <div className="border-t border-border-subtle pt-2">
            <Row
              label="Median time to verify"
              value={
                medianTimeToVerifyH > 0
                  ? medianTimeToVerifyH >= 48
                    ? `${Math.round(medianTimeToVerifyH / 24)}d`
                    : `${medianTimeToVerifyH.toFixed(1)}h`
                  : '—'
              }
            />
          </div>
        </Card>

        <Card title="Listings (all-time)">
          <Row label="Active" value={listingsByStatus.ACTIVE ?? 0} tone="success" />
          <Row label="Paused" value={listingsByStatus.PAUSED ?? 0} tone="warning" />
          <Row label="Drafts" value={listingsByStatus.DRAFT ?? 0} />
          <Row label="Closed" value={listingsByStatus.CLOSED ?? 0} tone="tertiary" />
        </Card>

        <Card title="Top advertisers (by inquiries)">
          {topAdvertisersRaw.length === 0 ? (
            <p className="text-body text-tertiary">No inquiries in this window.</p>
          ) : (
            <ol className="flex flex-col gap-1">
              {topAdvertisersRaw.map((a, idx) => (
                <li
                  key={a.advertiserCompanyId}
                  className="flex items-baseline justify-between gap-2 text-body"
                >
                  <span className="text-primary">
                    {idx + 1}. {advertiserNameById.get(a.advertiserCompanyId) ?? '?'}
                  </span>
                  <span className="text-tertiary">{a._count._all}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Top publishers (by confirmed deals)">
          {topPublishersRaw.length === 0 ? (
            <p className="text-body text-tertiary">No confirmed deals in this window.</p>
          ) : (
            <ol className="flex flex-col gap-1">
              {topPublishersRaw.map((p, idx) => (
                <li
                  key={p.publisherCompanyId}
                  className="flex items-baseline justify-between gap-2 text-body"
                >
                  <span className="text-primary">
                    {idx + 1}. {publisherNameById.get(p.publisherCompanyId) ?? '?'}
                  </span>
                  <span className="text-tertiary">{p._count._all}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </section>

      <p className="text-caption text-tertiary">
        CSV export + DAU/WAU/MAU charts + admin-perf metrics land in S-10.8b.
      </p>
    </main>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-surface p-4">
      <p className="text-caption uppercase text-tertiary">{label}</p>
      <p className="text-display-md tracking-tight text-primary">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface p-5">
      <h2 className="text-h3 text-primary">{title}</h2>
      {children}
    </div>
  );
}

const TONE: Record<string, string> = {
  success: 'text-success',
  danger: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
  tertiary: 'text-tertiary',
};

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: keyof typeof TONE | string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-body">
      <span className="text-secondary">{label}</span>
      <span className={tone ? TONE[tone] ?? 'text-primary' : 'text-primary'}>{value}</span>
    </div>
  );
}
