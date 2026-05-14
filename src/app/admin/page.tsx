import * as React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';

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
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Super Admin</p>
        <h1 className="text-display-lg tracking-tight text-primary">
          Welcome, {admin.name}
        </h1>
        <p className="text-body-lg text-secondary">
          Two-factor session is active. The full admin queue, verification
          review, and management tools roll in across S-03.5, S-04.6, E-09,
          and E-10.
        </p>
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
        <StatCard label="Active listings" value={listingsTotal} />
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-info/30 bg-info/10 p-5">
        <h2 className="text-h3 text-primary">Coming up</h2>
        <ul className="flex flex-col gap-1 text-body text-secondary">
          <li>S-09.3–10 inquiry detail, bulk actions, internal notes.</li>
          <li>S-10.2/3 user + company management.</li>
          <li>S-12.x generic audit log (current decisions are recorded on each VerificationRequest).</li>
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
