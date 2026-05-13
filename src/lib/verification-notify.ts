// Shared verification-decision notifier — invoked by the admin Server Action
// (S-03.5, lands in Phase 3) and by the dev approval script. Sends the right
// React Email template plus writes the in-app Notification row.

import VerificationApprovedEmail from '../../emails/VerificationApprovedEmail';
import VerificationRejectedEmail from '../../emails/VerificationRejectedEmail';
import { prisma } from '@/lib/prisma';
import { tryEmailSend } from '@/lib/email';

const APP_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export interface NotifyVerificationParams {
  companyId: string;
  decision: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO';
  reason?: string | null;
}

/**
 * Trigger emails + in-app notifications for every user of the company whose
 * verification was just decided. Failures fan out individually (one user's
 * email failing does not block the others).
 */
export async function notifyVerificationDecision({
  companyId,
  decision,
  reason,
}: NotifyVerificationParams): Promise<void> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      name: true,
      users: {
        select: { id: true, name: true, email: true, emailVerified: true },
      },
    },
  });
  if (!company) return;

  for (const user of company.users) {
    if (!user.emailVerified) continue;

    if (decision === 'APPROVED') {
      await tryEmailSend({
        userId: user.id,
        notification: {
          type: 'VERIFICATION_RESULT',
          title: 'Your company is verified',
          body: `${company.name} is now verified. You're cleared to use the platform.`,
          link: '/dashboard',
        },
        to: user.email,
        subject: `${company.name} is verified`,
        template: VerificationApprovedEmail,
        data: {
          name: user.name,
          companyName: company.name,
          cabinetUrl: `${APP_URL}/dashboard`,
        },
      });
    } else {
      // REJECTED or NEEDS_INFO — both ride the rejected template (it surfaces
      // a reason and a resubmit CTA).
      await tryEmailSend({
        userId: user.id,
        notification: {
          type: 'VERIFICATION_RESULT',
          title:
            decision === 'REJECTED'
              ? 'Verification declined'
              : 'More info needed for verification',
          body: reason ?? undefined,
          link: '/company-profile/verification',
        },
        to: user.email,
        subject:
          decision === 'REJECTED'
            ? `${company.name} verification needs attention`
            : `${company.name} — please send more documents`,
        template: VerificationRejectedEmail,
        data: {
          name: user.name,
          companyName: company.name,
          reason: reason ?? 'No reason provided.',
          appealUrl: `${APP_URL}/company-profile/verification`,
        },
      });
    }
  }
}
