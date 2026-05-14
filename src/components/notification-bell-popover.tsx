'use client';

import * as React from 'react';
import Link from 'next/link';

import {
  markAllNotificationsRead,
  openNotification,
} from '@/app/notifications/_actions';

export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  type: string;
  createdAtIso: string;
}

interface Props {
  unreadCount: number;
  items: NotificationItem[];
}

function relativeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function NotificationBellPopover({ unreadCount, items }: Props) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={
          unreadCount > 0
            ? `Notifications: ${unreadCount} unread`
            : 'Notifications'
        }
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex size-10 items-center justify-center rounded-full border border-border-subtle bg-surface text-secondary transition hover:border-border-strong hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span
            className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-on"
            aria-hidden
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-20 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-lg border border-border-subtle bg-surface p-3 shadow-lg shadow-black/40"
        >
          <header className="flex items-center justify-between gap-2 px-1">
            <p className="text-body text-primary">
              Notifications{' '}
              {unreadCount > 0 ? (
                <span className="text-caption text-tertiary">
                  · {unreadCount} unread
                </span>
              ) : null}
            </p>
            <form action={markAllNotificationsRead}>
              <button
                type="submit"
                disabled={unreadCount === 0}
                className="text-caption text-secondary underline-offset-4 hover:text-primary hover:underline disabled:opacity-50 disabled:hover:text-secondary disabled:hover:no-underline"
              >
                Mark all read
              </button>
            </form>
          </header>

          {items.length === 0 ? (
            <p className="px-2 py-6 text-center text-body text-secondary">
              You&apos;re all caught up.
            </p>
          ) : (
            <ul className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <form
                    action={openNotification}
                    className={`flex flex-col gap-1 rounded border px-3 py-2 text-left transition ${
                      n.isRead
                        ? 'border-border-subtle bg-background'
                        : 'border-accent/30 bg-accent/5'
                    }`}
                  >
                    <input type="hidden" name="id" value={n.id} />
                    <button
                      type="submit"
                      className="flex flex-col items-start gap-1 text-left"
                    >
                      <span className="flex w-full items-baseline justify-between gap-2">
                        <span className="text-body text-primary">{n.title}</span>
                        <span className="text-caption text-tertiary">
                          {relativeAgo(n.createdAtIso)}
                        </span>
                      </span>
                      {n.body ? (
                        <span className="line-clamp-2 text-caption text-secondary">
                          {n.body}
                        </span>
                      ) : null}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <footer className="border-t border-border-subtle pt-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-caption text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              See all →
            </Link>
          </footer>
        </div>
      ) : null}
    </div>
  );
}
