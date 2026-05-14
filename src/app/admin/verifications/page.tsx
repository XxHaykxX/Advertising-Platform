import * as React from 'react';
import Link from 'next/link';

import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Verifications — Admin',
};

const formatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default async function AdminVerificationsPage() {
  await requireAdmin();

  const pending = await prisma.verificationRequest.findMany({
    where: { decision: null },
    orderBy: { submittedAt: 'asc' },
    select: {
      id: true,
      submittedAt: true,
      documents: true,
      company: {
        select: {
          id: true,
          name: true,
          legalName: true,
          verificationStatus: true,
          users: { select: { role: true }, take: 1 },
        },
      },
    },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-8 py-12">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-caption uppercase text-tertiary">Super Admin · Queue</p>
          <h1 className="text-display-md tracking-tight text-primary">
            Pending verifications
          </h1>
          <p className="text-body text-secondary">
            {pending.length === 0
              ? 'Inbox zero. Nothing waiting for review.'
              : `${pending.length} request${pending.length === 1 ? '' : 's'} waiting. Oldest first.`}
          </p>
        </div>
        <Link
          href="/admin"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← Admin home
        </Link>
      </header>

      {pending.length === 0 ? (
        <section className="rounded-lg border border-border-subtle bg-surface p-8 text-center">
          <p className="text-body text-secondary">
            New verification requests will appear here as users submit them.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
          <table className="w-full border-collapse text-left">
            <thead className="bg-background text-caption uppercase text-tertiary">
              <tr>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Docs</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="text-body text-primary">
              {pending.map((req) => {
                const docCount = Array.isArray(req.documents) ? req.documents.length : 0;
                const role = req.company.users[0]?.role ?? '—';
                return (
                  <tr
                    key={req.id}
                    className="border-t border-border-subtle hover:bg-background"
                  >
                    <td className="px-4 py-3 text-secondary">
                      {formatter.format(req.submittedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-primary">{req.company.name}</span>
                        {req.company.legalName && req.company.legalName !== req.company.name ? (
                          <span className="text-caption text-tertiary">
                            {req.company.legalName}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-secondary">{role}</td>
                    <td className="px-4 py-3 text-secondary">
                      {req.company.verificationStatus}
                    </td>
                    <td className="px-4 py-3 text-secondary">{docCount}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/verifications/${req.id}`}
                        className="text-body text-accent underline-offset-4 hover:underline"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
