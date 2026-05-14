import * as React from 'react';
import Link from 'next/link';

import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';

import { CreateAdminForm } from './_create-form';
import { AdminRowControls } from './_row-controls';

export const metadata = {
  title: 'Admin team — Admin',
};

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const SUBROLE_TONE: Record<string, string> = {
  OWNER: 'bg-accent/10 text-accent border-accent/40',
  MANAGER: 'bg-info/10 text-info border-info/40',
  BROKER: 'bg-warning/10 text-warning border-warning/40',
  SUPPORT: 'bg-surface text-secondary border-border-strong',
};

export default async function AdminTeamPage() {
  const me = await requireAdmin();

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    orderBy: [{ adminSubrole: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      email: true,
      name: true,
      adminSubrole: true,
      twoFactorEnabled: true,
      mfaVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-8 py-12">
      <header className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-caption uppercase text-tertiary">Super Admin · Team</p>
          <h1 className="text-display-md tracking-tight text-primary">Admin team</h1>
          <p className="text-body text-secondary">
            {admins.length} admin{admins.length === 1 ? '' : 's'}. Sub-roles control nothing
            yet (S-08.3 will gate destructive ops) — they&apos;re informational metadata
            today.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← Admin home
        </Link>
      </header>

      <CreateAdminForm />

      <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
        <table className="w-full border-collapse text-left">
          <thead className="bg-background text-caption uppercase text-tertiary">
            <tr>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Sub-role</th>
              <th className="px-4 py-3 font-medium">2FA</th>
              <th className="px-4 py-3 font-medium">Last login</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="text-body text-primary">
            {admins.map((a) => {
              const isSelf = a.id === me.userId;
              const tone = a.adminSubrole
                ? SUBROLE_TONE[a.adminSubrole]
                : SUBROLE_TONE.SUPPORT;
              return (
                <tr key={a.id} className="border-t border-border-subtle hover:bg-background">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span>
                        {a.name}
                        {isSelf ? (
                          <span className="ml-2 text-caption text-tertiary">(you)</span>
                        ) : null}
                      </span>
                      <span className="text-caption text-tertiary">{a.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded border px-2 py-0.5 text-caption ${tone}`}
                    >
                      {a.adminSubrole ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-caption text-secondary">
                    {a.twoFactorEnabled ? (
                      <span className="text-success">Enrolled</span>
                    ) : (
                      <span className="text-warning">Not yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-caption text-secondary">
                    {a.lastLoginAt ? dateFmt.format(a.lastLoginAt) : 'never'}
                  </td>
                  <td className="px-4 py-3">
                    <AdminRowControls
                      userId={a.id}
                      currentSubrole={a.adminSubrole}
                      isSelf={isSelf}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="text-caption text-tertiary">
        Demoting / removing an admin isn&apos;t exposed in the UI yet — for now use
        Prisma Studio or write a one-off script. Lands as S-10.4b when the
        operational need surfaces.
      </p>
    </main>
  );
}
