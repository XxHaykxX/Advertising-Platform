// Dev-only helper: move an inquiry through the state machine without the
// admin queue (S-08.x → Phase 3 work). Mimics what an Owner/Manager admin
// will eventually do via /admin/inquiries.
//
// Usage:
//   npm run db:inquiry -- <inquiryId-or-tail-8> assign
//   npm run db:inquiry -- <inquiryId> progress
//   npm run db:inquiry -- <inquiryId> awaiting-publisher
//   npm run db:inquiry -- <inquiryId> awaiting-advertiser
//   npm run db:inquiry -- <inquiryId> confirm
//   npm run db:inquiry -- <inquiryId> lost "Publisher unavailable"
//
// `<inquiryId-or-tail-8>` accepts either the full cuid or the trailing 8
// characters that the detail page surfaces as "Inquiry #XYZ12345".

import { PrismaClient, type InquiryStatus } from '@prisma/client';

import { canTransitionInquiry } from '../src/lib/validation/inquiry';

const prisma = new PrismaClient();

const ACTION_MAP: Record<string, { status: InquiryStatus; action: string }> = {
  assign: { status: 'ASSIGNED', action: 'ADMIN_ASSIGNED' },
  progress: { status: 'IN_PROGRESS', action: 'ADMIN_PROGRESS' },
  'awaiting-publisher': { status: 'AWAITING_PUBLISHER', action: 'ADMIN_AWAIT_PUBLISHER' },
  'awaiting-advertiser': { status: 'AWAITING_ADVERTISER', action: 'ADMIN_AWAIT_ADVERTISER' },
  confirm: { status: 'CONFIRMED', action: 'ADMIN_CONFIRMED' },
  lost: { status: 'LOST', action: 'ADMIN_LOST' },
};

async function main() {
  const [idArg, actionArg, ...noteParts] = process.argv.slice(2);
  if (!idArg || !actionArg) {
    console.error(
      'Usage: npm run db:inquiry -- <inquiryId-or-tail-8> <action> [note]\n' +
        '  actions: assign, progress, awaiting-publisher, awaiting-advertiser, confirm, lost'
    );
    process.exit(1);
  }

  const recipe = ACTION_MAP[actionArg.toLowerCase()];
  if (!recipe) {
    console.error(`Unknown action: ${actionArg}. See --help.`);
    process.exit(1);
  }
  const note = noteParts.join(' ') || null;

  // Resolve inquiry — support the 8-char tail for ergonomics.
  let inquiry = await prisma.inquiry.findUnique({
    where: { id: idArg },
    select: { id: true, status: true },
  });
  if (!inquiry) {
    const matches = await prisma.inquiry.findMany({
      where: { id: { endsWith: idArg } },
      select: { id: true, status: true },
      take: 2,
    });
    if (matches.length === 1) inquiry = matches[0];
    else if (matches.length > 1) {
      console.error(`Ambiguous tail "${idArg}" — provide more characters.`);
      process.exit(1);
    }
  }
  if (!inquiry) {
    console.error(`Inquiry not found: ${idArg}`);
    process.exit(1);
  }

  if (!canTransitionInquiry(inquiry.status, recipe.status)) {
    console.error(
      `Cannot move ${inquiry.status} → ${recipe.status}. Check src/lib/validation/inquiry.ts.`
    );
    process.exit(1);
  }

  await prisma.$transaction([
    prisma.inquiry.update({
      where: { id: inquiry.id },
      data: {
        status: recipe.status,
        closedAt: ['CONFIRMED', 'LOST'].includes(recipe.status)
          ? new Date()
          : undefined,
      },
    }),
    prisma.inquiryAuditEntry.create({
      data: {
        inquiryId: inquiry.id,
        fromStatus: inquiry.status,
        toStatus: recipe.status,
        action: recipe.action,
        note,
      },
    }),
  ]);

  console.info(
    `[inquiry] ${inquiry.id} → ${recipe.status}${note ? ` (${note})` : ''}`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
