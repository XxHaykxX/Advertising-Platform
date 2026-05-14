import * as React from 'react';
import Link from 'next/link';

import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/prisma';

import { AnnouncementForm } from './_form';
import { endAnnouncement } from './_actions';

export const metadata = {
  title: 'Announcements — Admin',
};

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const AUDIENCE_LABEL: Record<string, string> = {
  ALL: 'Everyone',
  ADVERTISERS: 'Advertisers',
  PUBLISHERS: 'Publishers',
  ADMINS: 'Admins',
};

export default async function AdminAnnouncementsPage() {
  await requireAdmin();

  const now = new Date();
  const announcements = await prisma.announcement.findMany({
    orderBy: { startsAt: 'desc' },
    select: {
      id: true,
      title: true,
      body: true,
      audience: true,
      startsAt: true,
      endsAt: true,
      createdAt: true,
    },
  });

  // Resolve author names in a single query.
  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, name: true },
  });
  // Not strictly needed today (we don't include createdById in select), but
  // keeps the file ready for an "author" column later.
  void adminUsers;

  function status(a: { startsAt: Date; endsAt: Date }): {
    label: string;
    tone: string;
  } {
    if (a.endsAt <= now) return { label: 'Ended', tone: 'text-tertiary' };
    if (a.startsAt > now) return { label: 'Scheduled', tone: 'text-info' };
    return { label: 'Live', tone: 'text-success' };
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-8 py-12">
      <header className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-caption uppercase text-tertiary">Super Admin · Comms</p>
          <h1 className="text-display-md tracking-tight text-primary">Announcements</h1>
          <p className="text-body text-secondary">
            Broadcast a banner to advertisers, publishers, admins, or everyone. Active
            announcements show on the dashboard banner of the chosen audience.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-body text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          ← Admin home
        </Link>
      </header>

      <AnnouncementForm />

      <section className="flex flex-col gap-3">
        <h2 className="text-h3 text-primary">All announcements</h2>
        {announcements.length === 0 ? (
          <p className="rounded-lg border border-border-subtle bg-surface p-5 text-body text-secondary">
            None yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {announcements.map((a) => {
              const s = status(a);
              return (
                <li
                  key={a.id}
                  className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-body text-primary">{a.title}</p>
                    <p className={`text-caption ${s.tone}`}>{s.label}</p>
                  </div>
                  <p className="whitespace-pre-line text-body text-secondary">
                    {a.body}
                  </p>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-caption text-tertiary">
                    <span>
                      {AUDIENCE_LABEL[a.audience] ?? a.audience} · {dateFmt.format(a.startsAt)} →{' '}
                      {dateFmt.format(a.endsAt)}
                    </span>
                    {s.label !== 'Ended' ? (
                      <form action={endAnnouncement}>
                        <input type="hidden" name="id" value={a.id} />
                        <button
                          type="submit"
                          className="text-caption text-secondary underline-offset-4 hover:text-primary hover:underline"
                        >
                          End now
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
