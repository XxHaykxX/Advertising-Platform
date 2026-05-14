import * as React from 'react';
import Link from 'next/link';

import { prisma } from '@/lib/prisma';
import { inquiryStatusLabels, type InquiryStatusInput } from '@/lib/validation/inquiry';

// Human-readable verb per action. Anything not listed falls back to the raw
// action string so we never silently drop events.
const ACTION_VERB: Record<string, string> = {
  SUBMITTED: 'Inquiry submitted',
  ADMIN_ASSIGN: 'Assigned',
  ADMIN_UNASSIGN: 'Unassigned',
  ADMIN_REASSIGN: 'Reassigned',
  ADMIN_PROGRESS: 'Moved to In progress',
  ADMIN_AWAIT_PUBLISHER: 'Waiting on publisher',
  ADMIN_AWAIT_ADVERTISER: 'Waiting on advertiser',
  ADMIN_REOPEN: 'Reopened',
  ADMIN_CONFIRMED: 'Confirmed (deal closed)',
  ADMIN_LOST: 'Marked as Lost',
  ADMIN_CANCELLED: 'Cancelled',
  SEED: 'Seeded',
};

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

interface Props {
  inquiryId: string;
  order: 'asc' | 'desc';
}

export async function InquiryTimeline({ inquiryId, order }: Props) {
  const entries = await prisma.inquiryAuditEntry.findMany({
    where: { inquiryId },
    orderBy: { createdAt: order },
    select: {
      id: true,
      action: true,
      fromStatus: true,
      toStatus: true,
      note: true,
      actorUserId: true,
      createdAt: true,
    },
  });

  // Resolve actor names in a single query (no relation declared on the audit
  // table, so manual join).
  const actorIds = Array.from(
    new Set(entries.map((e) => e.actorUserId).filter((id): id is string => Boolean(id)))
  );
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, role: true },
      })
    : [];
  const actorById = new Map(actors.map((a) => [a.id, a]));

  const otherOrder: 'asc' | 'desc' = order === 'desc' ? 'asc' : 'desc';

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface p-5">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-h3 text-primary">Activity timeline</h2>
        <Link
          href={`?order=${otherOrder}`}
          replace
          scroll={false}
          className="text-caption text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          {order === 'desc' ? 'Newest first ↓' : 'Oldest first ↑'}
        </Link>
      </header>

      {entries.length === 0 ? (
        <p className="text-body text-secondary">No activity recorded yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {entries.map((entry) => {
            const actor = entry.actorUserId ? actorById.get(entry.actorUserId) : null;
            const verb = ACTION_VERB[entry.action] ?? entry.action;
            return (
              <li
                key={entry.id}
                className="flex flex-col gap-1 rounded border border-border-subtle bg-background px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-body text-primary">
                    {verb}
                    {entry.fromStatus && entry.toStatus ? (
                      <span className="text-secondary">
                        {' '}
                        ·{' '}
                        {inquiryStatusLabels[entry.fromStatus as InquiryStatusInput]} →{' '}
                        {inquiryStatusLabels[entry.toStatus as InquiryStatusInput]}
                      </span>
                    ) : entry.toStatus ? (
                      <span className="text-secondary">
                        {' '}
                        → {inquiryStatusLabels[entry.toStatus as InquiryStatusInput]}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-caption text-tertiary">
                    {dateFmt.format(entry.createdAt)}
                  </p>
                </div>
                <p className="text-caption text-tertiary">
                  {actor ? `${actor.name} · ${actor.role}` : 'System'}
                </p>
                {entry.note ? (
                  <p className="text-body text-secondary">{entry.note}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
