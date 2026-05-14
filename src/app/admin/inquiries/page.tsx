import * as React from 'react';
import Link from 'next/link';

import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import type { ChannelType, InquiryStatus, Prisma } from '@prisma/client';

import { ReassignControl, StatusControl } from './_row-actions';

export const metadata = {
  title: 'Inquiries — Admin',
};

const PAGE_SIZE = 50;

const STATUS_VALUES: InquiryStatus[] = [
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'AWAITING_PUBLISHER',
  'AWAITING_ADVERTISER',
  'CONFIRMED',
  'LOST',
  'CANCELLED',
];

const OPEN_STATUSES: InquiryStatus[] = [
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'AWAITING_PUBLISHER',
  'AWAITING_ADVERTISER',
];

const CHANNEL_VALUES: ChannelType[] = [
  'PRODUCT_PLACEMENT',
  'IN_VIDEO_AD',
  'WEBSITE_BANNER',
  'TV',
  'RADIO',
  'OUTDOOR',
  'SOCIAL',
  'PODCAST',
  'PRINT',
  'INFLUENCER',
  'EVENT',
];

const STATUS_BADGE_TONE: Record<InquiryStatus, string> = {
  NEW: 'bg-info/10 text-info border-info/30',
  ASSIGNED: 'bg-info/10 text-info border-info/30',
  IN_PROGRESS: 'bg-accent/10 text-accent border-accent/30',
  AWAITING_PUBLISHER: 'bg-warning/10 text-warning border-warning/30',
  AWAITING_ADVERTISER: 'bg-warning/10 text-warning border-warning/30',
  CONFIRMED: 'bg-success/10 text-success border-success/30',
  LOST: 'bg-danger/10 text-danger border-danger/30',
  CANCELLED: 'bg-surface text-tertiary border-border-subtle',
};

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function durationLabel(ms: number): string {
  const abs = Math.max(0, ms);
  if (abs < 60_000) return 'just now';
  const min = Math.floor(abs / 60_000);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

function ageLabel(from: Date): string {
  return durationLabel(Date.now() - from.getTime());
}

function slaState(deadline: Date | null, status: InquiryStatus): 'breached' | 'urgent' | 'ok' | 'none' {
  if (!deadline) return 'none';
  if (!OPEN_STATUSES.includes(status)) return 'none';
  const msLeft = deadline.getTime() - Date.now();
  if (msLeft < 0) return 'breached';
  if (msLeft < 60 * 60 * 1000) return 'urgent';
  return 'ok';
}

function parseStringArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function asString(value: string | string[] | undefined): string {
  if (!value) return '';
  return Array.isArray(value) ? (value[0] ?? '') : value;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function AdminInquiriesPage({ searchParams }: PageProps) {
  await requireAdmin();

  const rawStatuses = parseStringArray(searchParams.status).filter((s): s is InquiryStatus =>
    (STATUS_VALUES as string[]).includes(s)
  );
  const assignedRaw = asString(searchParams.assigned);
  const channel = asString(searchParams.channel) as ChannelType | '';
  const industryId = asString(searchParams.industry);
  const dateFromRaw = asString(searchParams.from);
  const dateToRaw = asString(searchParams.to);
  const slaOnly = asString(searchParams.sla) === '1';
  const q = asString(searchParams.q).trim();
  const page = Math.max(1, Number(asString(searchParams.page)) || 1);

  const dateFrom = parseDate(dateFromRaw);
  const dateTo = parseDate(dateToRaw);
  // Inclusive end-of-day for the `to` filter — users type a date, expect that day to count.
  const dateToEnd = dateTo ? new Date(dateTo.getTime() + 24 * 60 * 60 * 1000 - 1) : null;

  const andClauses: Prisma.InquiryWhereInput[] = [];
  if (rawStatuses.length) andClauses.push({ status: { in: rawStatuses } });
  if (assignedRaw === 'unassigned') andClauses.push({ assignedAdminId: null });
  else if (assignedRaw && assignedRaw !== 'any') andClauses.push({ assignedAdminId: assignedRaw });
  if (channel && (CHANNEL_VALUES as string[]).includes(channel)) {
    andClauses.push({ listing: { channelType: channel as ChannelType } });
  }
  if (industryId) {
    andClauses.push({ advertiserCompany: { industries: { some: { industryId } } } });
  }
  if (dateFrom) andClauses.push({ createdAt: { gte: dateFrom } });
  if (dateToEnd) andClauses.push({ createdAt: { lte: dateToEnd } });
  if (slaOnly) {
    andClauses.push({
      slaDeadline: { lt: new Date() },
      status: { in: OPEN_STATUSES },
    });
  }
  if (q) {
    andClauses.push({
      OR: [
        { advertiserCompany: { name: { contains: q } } },
        { publisherCompany: { name: { contains: q } } },
        { listing: { title: { contains: q } } },
        // tail-8 fallback so admins can paste the short ID we expose in copy.
        { id: { endsWith: q } },
      ],
    });
  }

  const where: Prisma.InquiryWhereInput = andClauses.length ? { AND: andClauses } : {};

  const [total, inquiries, admins, industries] = await prisma.$transaction([
    prisma.inquiry.count({ where }),
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        status: true,
        createdAt: true,
        slaDeadline: true,
        assignedAdminId: true,
        advertiserCompany: { select: { name: true } },
        publisherCompany: { select: { name: true } },
        listing: { select: { title: true, channelType: true } },
        assignedAdmin: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.industry.findMany({
      where: { archived: false },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  function pageHref(targetPage: number): string {
    const params = new URLSearchParams();
    rawStatuses.forEach((s) => params.append('status', s));
    if (assignedRaw) params.set('assigned', assignedRaw);
    if (channel) params.set('channel', channel);
    if (industryId) params.set('industry', industryId);
    if (dateFromRaw) params.set('from', dateFromRaw);
    if (dateToRaw) params.set('to', dateToRaw);
    if (slaOnly) params.set('sla', '1');
    if (q) params.set('q', q);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return qs ? `/admin/inquiries?${qs}` : '/admin/inquiries';
  }

  const hasFilters = Boolean(
    rawStatuses.length ||
      (assignedRaw && assignedRaw !== 'any') ||
      channel ||
      industryId ||
      dateFromRaw ||
      dateToRaw ||
      slaOnly ||
      q
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-8 py-10">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-caption uppercase text-tertiary">Super Admin · Queue</p>
          <h1 className="text-display-md tracking-tight text-primary">Inquiries</h1>
          <p className="text-body text-secondary">
            {total === 0 && !hasFilters
              ? 'No inquiries yet. They will appear here once advertisers start submitting.'
              : `${total} result${total === 1 ? '' : 's'}${hasFilters ? ' for current filters' : ''}.`}
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
        className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-5"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-caption uppercase text-tertiary">Search</span>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Company, listing, or inquiry ID"
              className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-caption uppercase text-tertiary">Assigned to</span>
            <select
              name="assigned"
              defaultValue={assignedRaw}
              className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
            >
              <option value="">Any</option>
              <option value="unassigned">Unassigned</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-caption uppercase text-tertiary">Channel type</span>
            <select
              name="channel"
              defaultValue={channel}
              className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
            >
              <option value="">Any</option>
              {CHANNEL_VALUES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-caption uppercase text-tertiary">Industry</span>
            <select
              name="industry"
              defaultValue={industryId}
              className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
            >
              <option value="">Any</option>
              {industries.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-caption uppercase text-tertiary">Created from</span>
            <input
              type="date"
              name="from"
              defaultValue={dateFromRaw}
              className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-caption uppercase text-tertiary">Created to</span>
            <input
              type="date"
              name="to"
              defaultValue={dateToRaw}
              className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </label>

          <label className="flex items-center gap-2 self-end pb-1">
            <input
              type="checkbox"
              name="sla"
              value="1"
              defaultChecked={slaOnly}
              className="size-4 rounded border-border-strong text-accent focus:ring-accent/40"
            />
            <span className="text-body text-primary">SLA-breached only</span>
          </label>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-caption uppercase text-tertiary">Status</legend>
          <div className="flex flex-wrap gap-2">
            {STATUS_VALUES.map((s) => {
              const checked = rawStatuses.includes(s);
              return (
                <label
                  key={s}
                  className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-1.5 text-body transition ${
                    checked
                      ? 'border-accent bg-accent/10 text-primary'
                      : 'border-border-subtle bg-background text-secondary hover:border-border-strong'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="status"
                    value={s}
                    defaultChecked={checked}
                    className="sr-only"
                  />
                  {s.replace(/_/g, ' ')}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded bg-accent px-4 text-body font-medium text-accent-on transition duration-200 ease-out-expo hover:bg-accent/90 motion-safe:hover:-translate-y-1 hover:shadow-md hover:shadow-accent/20"
          >
            Apply filters
          </button>
          {hasFilters ? (
            <Link
              href="/admin/inquiries"
              className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              Reset
            </Link>
          ) : null}
        </div>
      </form>

      <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        {inquiries.length === 0 ? (
          <p className="p-8 text-center text-body text-secondary">
            Nothing matches these filters.
          </p>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="bg-background text-caption uppercase text-tertiary">
              <tr>
                <th className="px-4 py-3 font-medium">Inquiry</th>
                <th className="px-4 py-3 font-medium">Advertiser</th>
                <th className="px-4 py-3 font-medium">Publisher · listing</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">SLA</th>
                <th className="px-4 py-3 font-medium">Assigned</th>
                <th className="px-4 py-3 font-medium">Age</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-body text-primary">
              {inquiries.map((inq) => {
                const sla = slaState(inq.slaDeadline, inq.status);
                return (
                  <tr
                    key={inq.id}
                    className="border-t border-border-subtle hover:bg-background"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/inquiries/${inq.id}`}
                        className="flex flex-col underline-offset-4 hover:underline"
                      >
                        <span className="font-mono text-caption text-accent">
                          INQ-{inq.id.slice(-8)}
                        </span>
                        <span className="text-caption text-tertiary">
                          {dateFmt.format(inq.createdAt)}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-secondary">
                      {inq.advertiserCompany.name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-secondary">{inq.publisherCompany.name}</span>
                        {inq.listing ? (
                          <span className="text-caption text-tertiary">
                            {inq.listing.title} ·{' '}
                            {inq.listing.channelType.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="text-caption text-tertiary">
                            (no specific listing)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-caption ${STATUS_BADGE_TONE[inq.status]}`}
                      >
                        {inq.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sla === 'breached' ? (
                        <span className="inline-flex items-center gap-1 text-danger">
                          ⚠ breached
                        </span>
                      ) : sla === 'urgent' ? (
                        <span className="inline-flex items-center gap-1 text-accent">
                          ⚠ &lt;1h
                        </span>
                      ) : sla === 'ok' && inq.slaDeadline ? (
                        <span className="text-secondary">
                          {durationLabel(inq.slaDeadline.getTime() - Date.now())} left
                        </span>
                      ) : (
                        <span className="text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ReassignControl
                        inquiryId={inq.id}
                        currentAdminId={inq.assignedAdminId}
                        admins={admins}
                      />
                    </td>
                    <td className="px-4 py-3 text-secondary">{ageLabel(inq.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusControl
                        inquiryId={inq.id}
                        currentStatus={inq.status}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {totalPages > 1 ? (
        <nav className="flex items-center justify-between gap-4">
          <p className="text-caption text-tertiary">
            Page {currentPage} of {totalPages} · showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-3">
            {currentPage > 1 ? (
              <Link
                href={pageHref(currentPage - 1)}
                className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
              >
                ← Previous
              </Link>
            ) : null}
            {currentPage < totalPages ? (
              <Link
                href={pageHref(currentPage + 1)}
                className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </main>
  );
}
