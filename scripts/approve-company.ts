// Dev-only helper: approve a company manually until the admin queue lands.
// Usage:
//   npm run db:approve -- user@example.com
//   npm run db:approve -- user@example.com REJECTED "Tax ID doesn't match"
//   npm run db:approve -- user@example.com NEEDS_INFO "Send a clearer scan"
//
// Defaults to APPROVED if no status is provided.

import { PrismaClient, type CompanyVerifStatus } from '@prisma/client';

import { notifyVerificationDecision } from '../src/lib/verification-notify';

const prisma = new PrismaClient();

async function main() {
  const [emailArg, statusArg, ...reasonParts] = process.argv.slice(2);
  if (!emailArg) {
    console.error(
      'Usage: npm run db:approve -- <email> [APPROVED|REJECTED|NEEDS_INFO] [reason]'
    );
    process.exit(1);
  }

  const status = (statusArg ?? 'APPROVED').toUpperCase() as CompanyVerifStatus;
  const reason = reasonParts.join(' ') || null;
  const validStatuses: CompanyVerifStatus[] = [
    'PENDING',
    'APPROVED',
    'REJECTED',
    'NEEDS_INFO',
  ];
  if (!validStatuses.includes(status)) {
    console.error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: emailArg.toLowerCase() },
    select: { id: true, role: true, companyId: true, name: true },
  });
  if (!user) {
    console.error(`User not found: ${emailArg}`);
    process.exit(1);
  }
  if (!user.companyId) {
    console.error(`User ${emailArg} has no company yet.`);
    process.exit(1);
  }

  const company = await prisma.company.update({
    where: { id: user.companyId },
    data: {
      verificationStatus: status,
      verifiedAt: status === 'APPROVED' ? new Date() : null,
      canAdvertise: status === 'APPROVED' && user.role === 'ADVERTISER',
      canPublish: status === 'APPROVED' && user.role === 'PUBLISHER',
    },
  });

  // Update the latest VerificationRequest if there is one.
  const latest = await prisma.verificationRequest.findFirst({
    where: { companyId: company.id },
    orderBy: { submittedAt: 'desc' },
  });
  if (latest) {
    await prisma.verificationRequest.update({
      where: { id: latest.id },
      data: {
        decision: status,
        decisionReason: reason,
        reviewedAt: new Date(),
      },
    });
  }

  console.info(`[approve] ${company.name} → ${status}${reason ? ` (${reason})` : ''}`);

  // Fire the result email + in-app notification (skipped for PENDING since
  // there is no decision to communicate).
  if (status !== 'PENDING') {
    await notifyVerificationDecision({
      companyId: company.id,
      decision: status,
      reason,
    });
    console.info(`[approve] notification dispatched for ${user.name}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
