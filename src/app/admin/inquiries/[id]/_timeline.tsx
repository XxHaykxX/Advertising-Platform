import * as React from 'react';
import Link from 'next/link';

import { prisma } from '@/lib/prisma';
import { inquiryStatusLabels, type InquiryStatusInput } from '@/lib/validation/inquiry';

import { NoteComposer } from './_note-composer';

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

interface TimelineEvent {
  id: string;
  kind: 'audit' | 'note';
  createdAt: Date;
  // audit fields
  action?: string;
  fromStatus?: InquiryStatusInput | null;
  toStatus?: InquiryStatusInput | null;
  auditNote?: string | null;
  actorUserId?: string | null;
  // note fields
  noteBody?: string;
  noteAuthorId?: string;
}

export async function InquiryTimeline({ inquiryId, order }: Props) {
  const [audits, notes] = await Promise.all([
    prisma.inquiryAuditEntry.findMany({
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
    }),
    prisma.internalNote.findMany({
      where: { inquiryId },
      orderBy: { createdAt: order },
      select: {
        id: true,
        body: true,
        authorAdminId: true,
        createdAt: true,
      },
    }),
  ]);

  const events: TimelineEvent[] = [
    ...audits.map(
      (a): TimelineEvent => ({
        id: `a:${a.id}`,
        kind: 'audit',
        createdAt: a.createdAt,
        action: a.action,
        fromStatus: a.fromStatus as InquiryStatusInput | null,
        toStatus: a.toStatus as InquiryStatusInput | null,
        auditNote: a.note,
        actorUserId: a.actorUserId,
      })
    ),
    ...notes.map(
      (n): TimelineEvent => ({
        id: `n:${n.id}`,
        kind: 'note',
        createdAt: n.createdAt,
        noteBody: n.body,
        noteAuthorId: n.authorAdminId,
      })
    ),
  ];

  events.sort((a, b) => {
    const diff = b.createdAt.getTime() - a.createdAt.getTime();
    return order === 'desc' ? diff : -diff;
  });

  // Resolve actor / author names with one user query covering both feeds.
  const userIds = Array.from(
    new Set(
      events
        .map((e) => e.actorUserId ?? e.noteAuthorId ?? null)
        .filter((id): id is string => Boolean(id))
    )
  );
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, role: true },
      })
    : [];
  const userById = new Map(users.map((u) => [u.id, u]));

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

      <NoteComposer inquiryId={inquiryId} />

      {events.length === 0 ? (
        <p className="text-body text-secondary">No activity recorded yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {events.map((event) => {
            if (event.kind === 'note') {
              const author = event.noteAuthorId ? userById.get(event.noteAuthorId) : null;
              return (
                <li
                  key={event.id}
                  className="flex flex-col gap-1 rounded border border-accent/30 bg-accent/5 px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-body text-primary">
                      Internal note
                      <span className="ml-2 text-caption text-tertiary">
                        {author ? `· ${author.name}` : ''}
                      </span>
                    </p>
                    <p className="text-caption text-tertiary">
                      {dateFmt.format(event.createdAt)}
                    </p>
                  </div>
                  <p className="whitespace-pre-line text-body text-primary">
                    {event.noteBody}
                  </p>
                </li>
              );
            }

            const actor = event.actorUserId ? userById.get(event.actorUserId) : null;
            const verb = event.action ? ACTION_VERB[event.action] ?? event.action : '';
            return (
              <li
                key={event.id}
                className="flex flex-col gap-1 rounded border border-border-subtle bg-background px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-body text-primary">
                    {verb}
                    {event.fromStatus && event.toStatus ? (
                      <span className="text-secondary">
                        {' '}
                        · {inquiryStatusLabels[event.fromStatus]} →{' '}
                        {inquiryStatusLabels[event.toStatus]}
                      </span>
                    ) : event.toStatus ? (
                      <span className="text-secondary">
                        {' '}
                        → {inquiryStatusLabels[event.toStatus]}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-caption text-tertiary">
                    {dateFmt.format(event.createdAt)}
                  </p>
                </div>
                <p className="text-caption text-tertiary">
                  {actor ? `${actor.name} · ${actor.role}` : 'System'}
                </p>
                {event.auditNote ? (
                  <p className="text-body text-secondary">{event.auditNote}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
