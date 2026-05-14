import * as React from 'react';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { AnnouncementAudience, UserRole } from '@prisma/client';

const ROLE_TO_AUDIENCES: Record<UserRole, AnnouncementAudience[]> = {
  ADVERTISER: ['ALL', 'ADVERTISERS'],
  PUBLISHER: ['ALL', 'PUBLISHERS'],
  ADMIN: ['ALL', 'ADMINS'],
};

/**
 * Top-of-page banner that surfaces every active announcement targeted at the
 * current viewer's role. Renders nothing when nothing is live — safe to drop
 * into any cabinet header. Most recent active announcement first.
 */
export async function AnnouncementBanner() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user) return null;

  const now = new Date();
  const active = await prisma.announcement.findMany({
    where: {
      startsAt: { lte: now },
      endsAt: { gte: now },
      audience: { in: ROLE_TO_AUDIENCES[user.role] },
    },
    orderBy: { startsAt: 'desc' },
    take: 3,
    select: { id: true, title: true, body: true },
  });

  if (active.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {active.map((a) => (
        <div
          key={a.id}
          role="status"
          className="flex flex-col gap-1 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3"
        >
          <p className="text-caption uppercase text-accent">Announcement</p>
          <p className="text-body text-primary">
            <span className="font-medium">{a.title}</span>
            {' — '}
            <span className="text-secondary">{a.body}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
