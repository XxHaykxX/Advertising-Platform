import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

import { markAllNotificationsRead, markNotificationRead } from './_actions';

export const metadata = {
  title: 'Notifications — Advertising Platform',
};

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: { page?: string; filter?: string };
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const filter = searchParams.filter === 'unread' ? 'unread' : 'all';
  const page = Math.max(1, Number(searchParams.page) || 1);

  const where = {
    userId: session.user.id,
    ...(filter === 'unread' ? { readAt: null } : {}),
  };

  const [total, items, unreadCount] = await prisma.$transaction([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        body: true,
        link: true,
        readAt: true,
        type: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-caption uppercase text-tertiary">Inbox</p>
        <h1 className="text-display-md tracking-tight text-primary">Notifications</h1>
        <p className="text-body text-secondary">
          {unreadCount > 0
            ? `${unreadCount} unread.`
            : 'You’re all caught up.'}{' '}
          {total} total.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Link
            href="/notifications"
            className={`rounded border px-3 py-1.5 text-caption transition ${
              filter === 'all'
                ? 'border-accent bg-accent/10 text-primary'
                : 'border-border-subtle bg-background text-secondary hover:border-border-strong'
            }`}
          >
            All
          </Link>
          <Link
            href="/notifications?filter=unread"
            className={`rounded border px-3 py-1.5 text-caption transition ${
              filter === 'unread'
                ? 'border-accent bg-accent/10 text-primary'
                : 'border-border-subtle bg-background text-secondary hover:border-border-strong'
            }`}
          >
            Unread ({unreadCount})
          </Link>
        </div>
        <form action={markAllNotificationsRead}>
          <button
            type="submit"
            disabled={unreadCount === 0}
            className="text-caption text-secondary underline-offset-4 hover:text-primary hover:underline disabled:opacity-50 disabled:hover:text-secondary disabled:hover:no-underline"
          >
            Mark all read
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <section className="rounded-lg border border-border-subtle bg-surface p-8 text-center">
          <p className="text-body text-secondary">Nothing here.</p>
        </section>
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`flex flex-col gap-2 rounded-lg border px-4 py-3 ${
                n.readAt
                  ? 'border-border-subtle bg-surface'
                  : 'border-accent/30 bg-accent/5'
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-body text-primary">
                  {n.link ? (
                    <Link
                      href={n.link}
                      className="underline-offset-4 hover:underline"
                    >
                      {n.title}
                    </Link>
                  ) : (
                    n.title
                  )}
                </p>
                <span className="text-caption text-tertiary">
                  {dateFmt.format(n.createdAt)}
                </span>
              </div>
              {n.body ? (
                <p className="whitespace-pre-line text-body text-secondary">{n.body}</p>
              ) : null}
              {!n.readAt ? (
                <form action={markNotificationRead} className="self-end">
                  <input type="hidden" name="id" value={n.id} />
                  <button
                    type="submit"
                    className="text-caption text-secondary underline-offset-4 hover:text-primary hover:underline"
                  >
                    Mark read
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {totalPages > 1 ? (
        <nav className="flex items-center justify-between text-caption text-tertiary">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-3">
            {page > 1 ? (
              <Link
                href={`/notifications?${filter === 'unread' ? 'filter=unread&' : ''}page=${page - 1}`}
                className="text-secondary underline-offset-4 hover:text-primary hover:underline"
              >
                ← Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={`/notifications?${filter === 'unread' ? 'filter=unread&' : ''}page=${page + 1}`}
                className="text-secondary underline-offset-4 hover:text-primary hover:underline"
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
