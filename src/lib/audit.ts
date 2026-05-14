import { headers } from 'next/headers';

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export interface RecordAuditInput {
  actorUserId?: string | null;
  action: string;
  entityType:
    | 'COMPANY'
    | 'INQUIRY'
    | 'LISTING'
    | 'USER'
    | 'ANNOUNCEMENT'
    | 'INDUSTRY'
    | 'VERIFICATION_REQUEST'
    | 'PLATFORM';
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
}

/**
 * Write a row to the platform-wide audit log. Never throws — audit failures
 * should not break the action that triggered them. Failures are best-effort
 * logged to the server console for later forensics.
 *
 * Pulls the client IP from the request headers when available (Hostinger
 * passes `x-forwarded-for`); falls back to `unknown`.
 */
export async function recordAudit(input: RecordAuditInput): Promise<void> {
  try {
    let ip: string | null = null;
    try {
      const h = await headers();
      const fwd = h.get('x-forwarded-for');
      ip = fwd ? (fwd.split(',')[0]?.trim() ?? null) : h.get('x-real-ip');
    } catch {
      // `headers()` is only valid in a request context; skip when called
      // from a script or cron.
    }

    await prisma.auditEntry.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        before: input.before,
        after: input.after,
        ip,
      },
    });
  } catch (err) {
    console.error('[audit] failed to record', input.action, err);
  }
}
