import * as React from 'react';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

import { NotificationBellPopover, type NotificationItem } from './notification-bell-popover';

/**
 * Server wrapper. Fetches unread count + last 8 notifications for the current
 * user, then hands off to the client popover. Returns null when there's no
 * session so it's safe to drop into shared headers.
 */
export async function NotificationBell() {
  const session = await auth();
  if (!session?.user) return null;

  const userId = session.user.id;

  const [unreadCount, recent] = await Promise.all([
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
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
  ]);

  const items: NotificationItem[] = recent.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    link: n.link,
    isRead: Boolean(n.readAt),
    type: n.type,
    // Send a serialisable ISO string so the client doesn't have to think
    // about Date objects in props.
    createdAtIso: n.createdAt.toISOString(),
  }));

  return <NotificationBellPopover unreadCount={unreadCount} items={items} />;
}
