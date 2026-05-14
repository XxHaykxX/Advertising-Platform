import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import type { CompanyVerifStatus } from '@prisma/client';

export const metadata = {
  title: 'Company — Admin',
};

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const dateOnlyFmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

const STATUS_TONE: Record<CompanyVerifStatus, string> = {
  PENDING: 'bg-info/10 text-info border-info/30',
  APPROVED: 'bg-success/10 text-success border-success/30',
  REJECTED: 'bg-danger/10 text-danger border-danger/30',
  NEEDS_INFO: 'bg-warning/10 text-warning border-warning/30',
};

interface PageProps {
  params: { id: string };
}

export default async function AdminCompanyDetailPage({ params }: PageProps) {
  await requireAdmin();

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      legalName: true,
      taxId: true,
      type: true,
      foundingYear: true,
      country: true,
      address: true,
      logoUrl: true,
      channelsOfInterest: true,
      verificationStatus: true,
      verifiedAt: true,
      canAdvertise: true,
      canPublish: true,
      createdAt: true,
      industries: { select: { industry: { select: { name: true } } } },
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          lastLoginAt: true,
          suspended: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      listings: {
        select: {
          id: true,
          title: true,
          status: true,
          channelType: true,
          viewCount: true,
          inquiryCount: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      },
      verificationRequests: {
        select: {
          id: true,
          submittedAt: true,
          decision: true,
          decisionReason: true,
          reviewedAt: true,
          reviewedByAdminId: true,
        },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });
  if (!company) notFound();

  const [advertiserInquiries, publisherInquiries] = await Promise.all([
    prisma.inquiry.findMany({
      where: { advertiserCompanyId: company.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        createdAt: true,
        publisherCompany: { select: { name: true } },
      },
    }),
    prisma.inquiry.findMany({
      where: { publisherCompanyId: company.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        createdAt: true,
        advertiserCompany: { select: { name: true } },
      },
    }),
  ]);

  const channels = Array.isArray(company.channelsOfInterest)
    ? (company.channelsOfInterest as string[])
    : [];

  // Manual actor lookup for verification reviewer names.
  const reviewerIds = Array.from(
    new Set(
      company.verificationRequests
        .map((v) => v.reviewedByAdminId)
        .filter((id): id is string => Boolean(id))
    )
  );
  const reviewers = reviewerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: reviewerIds } },
        select: { id: true, name: true },
      })
    : [];
  const reviewerById = new Map(reviewers.map((r) => [r.id, r.name]));

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-8 py-10">
      <header className="flex flex-col gap-3">
        <Link
          href="/admin/companies"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← All companies
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-caption uppercase text-tertiary">
              Company · {company.id.slice(-8)}
            </p>
            <h1 className="text-display-md tracking-tight text-primary">
              {company.name}
            </h1>
            {company.legalName && company.legalName !== company.name ? (
              <p className="text-body text-secondary">{company.legalName}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded border px-2 py-0.5 text-caption ${STATUS_TONE[company.verificationStatus]}`}
              >
                {company.verificationStatus}
              </span>
              {company.canAdvertise ? (
                <span className="text-caption text-success">Advertiser</span>
              ) : null}
              {company.canPublish ? (
                <span className="text-caption text-success">Publisher</span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Basics">
          <Row label="Tax / Reg ID" value={company.taxId ?? '—'} />
          <Row label="Type" value={company.type ?? '—'} />
          <Row label="Founded" value={company.foundingYear ?? '—'} />
          <Row label="Country" value={company.country} />
          <Row label="Address" value={company.address ?? '—'} />
          <Row
            label="Industries"
            value={
              company.industries.length
                ? company.industries.map((i) => i.industry.name).join(', ')
                : '—'
            }
          />
          {channels.length ? (
            <Row label="Channels of interest" value={channels.join(', ')} />
          ) : null}
          <Row label="Joined" value={dateOnlyFmt.format(company.createdAt)} />
          {company.verifiedAt ? (
            <Row label="Verified at" value={dateOnlyFmt.format(company.verifiedAt)} />
          ) : null}
        </Card>

        <Card title={`Employees (${company.users.length})`}>
          {company.users.length === 0 ? (
            <p className="text-body text-tertiary">No employees attached.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {company.users.map((u) => (
                <li key={u.id} className="flex flex-col gap-0.5 text-body">
                  <span className="text-primary">{u.name}</span>
                  <span className="text-caption text-tertiary">
                    {u.email} · {u.role}
                    {u.suspended ? ' · suspended' : ''}
                  </span>
                  <span className="text-caption text-tertiary">
                    Last login: {u.lastLoginAt ? dateFmt.format(u.lastLoginAt) : 'never'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Card title={`Listings (${company.listings.length})`}>
        {company.listings.length === 0 ? (
          <p className="text-body text-tertiary">No listings yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {company.listings.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-baseline justify-between gap-2 text-body"
              >
                <Link
                  href={`/admin/listings/${l.id}/override?to=paused`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {l.title}
                </Link>
                <span className="text-caption text-tertiary">
                  {l.status} · {l.channelType.replace(/_/g, ' ')} · {l.viewCount} views ·{' '}
                  {l.inquiryCount} inquiries
                </span>
              </li>
            ))}
          </ul>
        )}
        {company.listings.length === 10 ? (
          <Link
            href={`/admin/listings?q=${encodeURIComponent(company.name)}`}
            className="text-caption text-secondary underline-offset-4 hover:text-primary hover:underline"
          >
            View all listings →
          </Link>
        ) : null}
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title={`Inquiries as advertiser (${advertiserInquiries.length})`}>
          {advertiserInquiries.length === 0 ? (
            <p className="text-body text-tertiary">No inquiries submitted.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {advertiserInquiries.map((q) => (
                <li
                  key={q.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 text-body"
                >
                  <Link
                    href={`/admin/inquiries/${q.id}`}
                    className="font-mono text-caption text-accent underline-offset-4 hover:underline"
                  >
                    INQ-{q.id.slice(-8)}
                  </Link>
                  <span className="text-caption text-tertiary">
                    {q.status.replace(/_/g, ' ')} · → {q.publisherCompany.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Inquiries as publisher (${publisherInquiries.length})`}>
          {publisherInquiries.length === 0 ? (
            <p className="text-body text-tertiary">No inquiries received.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {publisherInquiries.map((q) => (
                <li
                  key={q.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 text-body"
                >
                  <Link
                    href={`/admin/inquiries/${q.id}`}
                    className="font-mono text-caption text-accent underline-offset-4 hover:underline"
                  >
                    INQ-{q.id.slice(-8)}
                  </Link>
                  <span className="text-caption text-tertiary">
                    {q.status.replace(/_/g, ' ')} · from {q.advertiserCompany.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Card title={`Verification history (${company.verificationRequests.length})`}>
        {company.verificationRequests.length === 0 ? (
          <p className="text-body text-tertiary">No requests submitted.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {company.verificationRequests.map((v) => (
              <li
                key={v.id}
                className="flex flex-col gap-1 rounded border border-border-subtle bg-background p-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-body">
                  <span className="text-primary">
                    Submitted {dateFmt.format(v.submittedAt)}
                  </span>
                  <span
                    className={`text-caption ${
                      v.decision === 'APPROVED'
                        ? 'text-success'
                        : v.decision === 'REJECTED'
                          ? 'text-danger'
                          : v.decision === 'NEEDS_INFO'
                            ? 'text-warning'
                            : 'text-info'
                    }`}
                  >
                    {v.decision ?? 'Pending'}
                  </span>
                </div>
                {v.decisionReason ? (
                  <p className="text-caption text-secondary">{v.decisionReason}</p>
                ) : null}
                {v.reviewedAt ? (
                  <p className="text-caption text-tertiary">
                    Reviewed {dateFmt.format(v.reviewedAt)}
                    {v.reviewedByAdminId
                      ? ` by ${reviewerById.get(v.reviewedByAdminId) ?? '?'}`
                      : ''}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-5">
      <h2 className="text-h3 text-primary">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption uppercase text-tertiary">{label}</span>
      <span className="text-body text-primary">{value}</span>
    </div>
  );
}
