import * as React from 'react';
import Link from 'next/link';

import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const metadata = {
  title: 'Audit log — Admin',
};

const PAGE_SIZE = 50;

const ENTITY_TYPES = [
  'COMPANY',
  'INQUIRY',
  'LISTING',
  'USER',
  'ANNOUNCEMENT',
  'INDUSTRY',
  'VERIFICATION_REQUEST',
  'PLATFORM',
];

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function asString(v: string | string[] | undefined): string {
  if (!v) return '';
  return Array.isArray(v) ? (v[0] ?? '') : v;
}

function parseDate(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function AdminAuditPage({ searchParams }: PageProps) {
  await requireAdmin();

  const actor = asString(searchParams.actor).trim();
  const action = asString(searchParams.action).trim();
  const entityType = asString(searchParams.entity).trim();
  const fromRaw = asString(searchParams.from);
  const toRaw = asString(searchParams.to);
  const page = Math.max(1, Number(asString(searchParams.page)) || 1);

  const fromDate = parseDate(fromRaw);
  const toDate = parseDate(toRaw);
  const toEnd = toDate ? new Date(toDate.getTime() + 24 * 60 * 60 * 1000 - 1) : null;

  const where: Prisma.AuditEntryWhereInput = {};
  if (actor) where.actorUserId = actor;
  if (action) where.action = { contains: action };
  if (entityType && ENTITY_TYPES.includes(entityType)) where.entityType = entityType;
  if (fromDate || toEnd) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toEnd) where.createdAt.lte = toEnd;
  }

  const [total, entries, admins] = await prisma.$transaction([
    prisma.auditEntry.count({ where }),
    prisma.auditEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        before: true,
        after: true,
        ip: true,
        actorUserId: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const actorIds = Array.from(
    new Set(
      entries
        .map((e) => e.actorUserId)
        .filter((id): id is string => Boolean(id))
    )
  );
  const actorRecords = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const actorById = new Map(actorRecords.map((u) => [u.id, u]));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  function pageHref(target: number): string {
    const params = new URLSearchParams();
    if (actor) params.set('actor', actor);
    if (action) params.set('action', action);
    if (entityType) params.set('entity', entityType);
    if (fromRaw) params.set('from', fromRaw);
    if (toRaw) params.set('to', toRaw);
    if (target > 1) params.set('page', String(target));
    const qs = params.toString();
    return qs ? `/admin/audit?${qs}` : '/admin/audit';
  }

  const hasFilters = Boolean(actor || action || entityType || fromRaw || toRaw);

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-8 py-10">
      <header className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-caption uppercase text-tertiary">Super Admin · Audit</p>
          <h1 className="text-display-md tracking-tight text-primary">Audit log</h1>
          <p className="text-body text-secondary">
            {total} entries{hasFilters ? ' for current filters' : ''}. Read-only.
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
        className="grid grid-cols-1 gap-3 rounded-lg border border-border-subtle bg-surface p-5 md:grid-cols-5"
      >
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Actor</span>
          <select
            name="actor"
            defaultValue={actor}
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          >
            <option value="">Any admin</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Action contains</span>
          <input
            type="search"
            name="action"
            defaultValue={action}
            placeholder="e.g. VERIFICATION"
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Entity type</span>
          <select
            name="entity"
            defaultValue={entityType}
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          >
            <option value="">Any</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">From</span>
          <input
            type="date"
            name="from"
            defaultValue={fromRaw}
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">To</span>
          <input
            type="date"
            name="to"
            defaultValue={toRaw}
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
        <div className="md:col-span-5 flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded bg-accent px-4 text-body font-medium text-accent-on transition hover:bg-accent/90 motion-safe:hover:-translate-y-1 hover:shadow-md hover:shadow-accent/20"
          >
            Apply
          </button>
          {hasFilters ? (
            <Link
              href="/admin/audit"
              className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              Reset
            </Link>
          ) : null}
        </div>
      </form>

      <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        {entries.length === 0 ? (
          <p className="p-8 text-center text-body text-secondary">
            Nothing matches.
          </p>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="bg-background text-caption uppercase text-tertiary">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Detail</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="text-body text-primary">
              {entries.map((e) => {
                const a = e.actorUserId ? actorById.get(e.actorUserId) : null;
                const beforeJson = e.before ? JSON.stringify(e.before) : '';
                const afterJson = e.after ? JSON.stringify(e.after) : '';
                return (
                  <tr
                    key={e.id}
                    className="border-t border-border-subtle hover:bg-background"
                  >
                    <td className="px-4 py-3 text-caption text-secondary">
                      {dateFmt.format(e.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-caption">
                      {a ? (
                        <div className="flex flex-col">
                          <span className="text-primary">{a.name}</span>
                          <span className="text-tertiary">{a.email}</span>
                        </div>
                      ) : (
                        <span className="text-tertiary">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-caption text-primary">
                      {e.action}
                    </td>
                    <td className="px-4 py-3 text-caption">
                      <div className="flex flex-col">
                        <span className="text-secondary">{e.entityType}</span>
                        <span className="font-mono text-tertiary">{e.entityId.slice(-8)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {beforeJson || afterJson ? (
                        <details className="text-caption">
                          <summary className="cursor-pointer text-secondary underline-offset-4 hover:text-primary hover:underline">
                            View diff
                          </summary>
                          <div className="mt-2 flex flex-col gap-2">
                            {beforeJson ? (
                              <pre className="overflow-x-auto rounded bg-background p-2 font-mono text-caption text-danger">
                                - {beforeJson}
                              </pre>
                            ) : null}
                            {afterJson ? (
                              <pre className="overflow-x-auto rounded bg-background p-2 font-mono text-caption text-success">
                                + {afterJson}
                              </pre>
                            ) : null}
                          </div>
                        </details>
                      ) : (
                        <span className="text-caption text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-caption text-tertiary">
                      {e.ip ?? '—'}
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
