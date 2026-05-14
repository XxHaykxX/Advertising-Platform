import * as React from 'react';
import Link from 'next/link';

import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import type { CompanyVerifStatus, Prisma } from '@prisma/client';

export const metadata = {
  title: 'Companies — Admin',
};

const PAGE_SIZE = 50;
const STATUSES: CompanyVerifStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_INFO'];

const STATUS_TONE: Record<CompanyVerifStatus, string> = {
  PENDING: 'bg-info/10 text-info border-info/30',
  APPROVED: 'bg-success/10 text-success border-success/30',
  REJECTED: 'bg-danger/10 text-danger border-danger/30',
  NEEDS_INFO: 'bg-warning/10 text-warning border-warning/30',
};

const dateFmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

function asString(v: string | string[] | undefined): string {
  if (!v) return '';
  return Array.isArray(v) ? (v[0] ?? '') : v;
}

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function AdminCompaniesPage({ searchParams }: PageProps) {
  await requireAdmin();

  const status = asString(searchParams.status) as CompanyVerifStatus | '';
  const q = asString(searchParams.q).trim();
  const page = Math.max(1, Number(asString(searchParams.page)) || 1);

  const where: Prisma.CompanyWhereInput = {};
  if (status && (STATUSES as string[]).includes(status)) where.verificationStatus = status;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { legalName: { contains: q } },
      { taxId: { contains: q } },
    ];
  }

  const [total, companies] = await prisma.$transaction([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        legalName: true,
        country: true,
        verificationStatus: true,
        canAdvertise: true,
        canPublish: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            listings: true,
            inquiriesAsAdvertiser: true,
            inquiriesAsPublisher: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  function pageHref(target: number): string {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    if (target > 1) params.set('page', String(target));
    const qs = params.toString();
    return qs ? `/admin/companies?${qs}` : '/admin/companies';
  }

  const hasFilters = Boolean(status || q);

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-8 py-10">
      <header className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-caption uppercase text-tertiary">Super Admin · People</p>
          <h1 className="text-display-md tracking-tight text-primary">Companies</h1>
          <p className="text-body text-secondary">
            {total} compan{total === 1 ? 'y' : 'ies'}
            {hasFilters ? ' matching filters' : ''}. Pending review queue:{' '}
            <Link
              href="/admin/verifications"
              className="text-accent underline-offset-4 hover:underline"
            >
              /admin/verifications
            </Link>
            .
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
        className="grid grid-cols-1 gap-4 rounded-lg border border-border-subtle bg-surface p-5 md:grid-cols-3"
      >
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Name, legal name, or tax ID"
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Verification status</span>
          <select
            name="status"
            defaultValue={status}
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          >
            <option value="">Any</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded bg-accent px-4 text-body font-medium text-accent-on transition hover:bg-accent/90 motion-safe:hover:-translate-y-1 hover:shadow-md hover:shadow-accent/20"
          >
            Apply
          </button>
          {hasFilters ? (
            <Link
              href="/admin/companies"
              className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              Reset
            </Link>
          ) : null}
        </div>
      </form>

      <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        {companies.length === 0 ? (
          <p className="p-8 text-center text-body text-secondary">No companies match.</p>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="bg-background text-caption uppercase text-tertiary">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium">Roles</th>
                <th className="px-4 py-3 font-medium">Users</th>
                <th className="px-4 py-3 font-medium">Listings</th>
                <th className="px-4 py-3 font-medium">Inquiries</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="text-body text-primary">
              {companies.map((c) => {
                const totalInq =
                  c._count.inquiriesAsAdvertiser + c._count.inquiriesAsPublisher;
                return (
                  <tr
                    key={c.id}
                    className="border-t border-border-subtle hover:bg-background"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <Link
                          href={`/admin/companies/${c.id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {c.name}
                        </Link>
                        {c.legalName && c.legalName !== c.name ? (
                          <span className="text-caption text-tertiary">{c.legalName}</span>
                        ) : null}
                        <span className="text-caption text-tertiary">{c.country}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-caption ${STATUS_TONE[c.verificationStatus]}`}
                      >
                        {c.verificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-caption text-secondary">
                      {c.canAdvertise ? 'Advertiser ' : ''}
                      {c.canPublish ? 'Publisher' : ''}
                      {!c.canAdvertise && !c.canPublish ? '—' : ''}
                    </td>
                    <td className="px-4 py-3 text-secondary">{c._count.users}</td>
                    <td className="px-4 py-3 text-secondary">
                      {c._count.listings > 0 ? (
                        <Link
                          href={`/admin/listings?q=${encodeURIComponent(c.name)}`}
                          className="underline-offset-4 hover:text-primary hover:underline"
                        >
                          {c._count.listings}
                        </Link>
                      ) : (
                        c._count.listings
                      )}
                    </td>
                    <td className="px-4 py-3 text-secondary">
                      {totalInq > 0 ? (
                        <Link
                          href={`/admin/inquiries?q=${encodeURIComponent(c.name)}`}
                          className="underline-offset-4 hover:text-primary hover:underline"
                        >
                          {totalInq}
                        </Link>
                      ) : (
                        totalInq
                      )}
                    </td>
                    <td className="px-4 py-3 text-caption text-secondary">
                      {dateFmt.format(c.createdAt)}
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
            Page {currentPage} of {totalPages}
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
