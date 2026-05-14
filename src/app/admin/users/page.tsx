import * as React from 'react';
import Link from 'next/link';

import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';
import type { Prisma, UserRole } from '@prisma/client';

import { UserRowControls } from './_row-controls';

export const metadata = {
  title: 'Users — Admin',
};

const PAGE_SIZE = 50;
const ROLES: UserRole[] = ['ADVERTISER', 'PUBLISHER', 'ADMIN'];

const dateFmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

function asString(v: string | string[] | undefined): string {
  if (!v) return '';
  return Array.isArray(v) ? (v[0] ?? '') : v;
}

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const me = await requireAdmin();

  const role = asString(searchParams.role) as UserRole | '';
  const q = asString(searchParams.q).trim();
  const page = Math.max(1, Number(asString(searchParams.page)) || 1);

  const where: Prisma.UserWhereInput = {};
  if (role && (ROLES as string[]).includes(role)) where.role = role;
  if (q) {
    where.OR = [
      { email: { contains: q } },
      { name: { contains: q } },
      { company: { name: { contains: q } } },
    ];
  }

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        suspended: true,
        suspendReason: true,
        company: {
          select: { id: true, name: true, verificationStatus: true },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  function pageHref(target: number): string {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (q) params.set('q', q);
    if (target > 1) params.set('page', String(target));
    const qs = params.toString();
    return qs ? `/admin/users?${qs}` : '/admin/users';
  }

  const hasFilters = Boolean(role || q);

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-8 py-10">
      <header className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-caption uppercase text-tertiary">Super Admin · People</p>
          <h1 className="text-display-md tracking-tight text-primary">Users</h1>
          <p className="text-body text-secondary">
            {total} user{total === 1 ? '' : 's'}
            {hasFilters ? ' matching filters' : ''}. Admins are managed separately on{' '}
            <Link
              href="/admin/team"
              className="text-accent underline-offset-4 hover:underline"
            >
              /admin/team
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
            placeholder="Name, email, or company"
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary placeholder:text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caption uppercase text-tertiary">Role</span>
          <select
            name="role"
            defaultValue={role}
            className="rounded border border-border-subtle bg-background px-3 py-2 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          >
            <option value="">Any</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
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
              href="/admin/users"
              className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              Reset
            </Link>
          ) : null}
        </div>
      </form>

      <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        {users.length === 0 ? (
          <p className="p-8 text-center text-body text-secondary">No users match.</p>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="bg-background text-caption uppercase text-tertiary">
              <tr>
                <th className="px-4 py-3 font-medium">Name / email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last login</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-body text-primary">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-border-subtle hover:bg-background"
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span>{u.name}</span>
                      <span className="text-caption text-tertiary">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-secondary">{u.role}</td>
                  <td className="px-4 py-3">
                    {u.company ? (
                      <div className="flex flex-col">
                        <Link
                          href={`/admin/companies?q=${encodeURIComponent(u.company.name)}`}
                          className="text-secondary underline-offset-4 hover:text-primary hover:underline"
                        >
                          {u.company.name}
                        </Link>
                        <span className="text-caption text-tertiary">
                          {u.company.verificationStatus}
                        </span>
                      </div>
                    ) : (
                      <span className="text-caption text-tertiary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-caption">
                    {u.suspended ? (
                      <div className="flex flex-col">
                        <span className="text-danger">Suspended</span>
                        {u.suspendReason ? (
                          <span className="text-tertiary">{u.suspendReason}</span>
                        ) : null}
                      </div>
                    ) : u.emailVerified ? (
                      <span className="text-success">Active</span>
                    ) : (
                      <span className="text-warning">Email not verified</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-caption text-secondary">
                    {u.lastLoginAt ? dateFmt.format(u.lastLoginAt) : 'never'}
                  </td>
                  <td className="px-4 py-3">
                    <UserRowControls
                      userId={u.id}
                      role={u.role}
                      suspended={u.suspended}
                      isSelf={u.id === me.userId}
                    />
                  </td>
                </tr>
              ))}
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
