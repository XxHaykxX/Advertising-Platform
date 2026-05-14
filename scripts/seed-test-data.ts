// Dev-only test fixture loader. Drops + recreates a deterministic set of
// "[TEST]" companies, users, listings, verification requests, and inquiries
// so the admin-flow checklist can be run end-to-end in under a minute.
//
// Usage:
//   npm run db:seed-test
//
// Every test user shares the password "Password123!" and has an email under
// the @test.local domain. Re-runs of the script wipe the previous fixture
// first, so it is safe to run repeatedly — but it WILL delete every row
// whose User.email ends in @test.local and every Company whose name starts
// with "[TEST]". Do NOT run against production.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import bcrypt from 'bcryptjs';
import {
  PrismaClient,
  type CompanyVerifStatus,
  type InquiryStatus,
  type Prisma,
  type UserRole,
} from '@prisma/client';

const prisma = new PrismaClient();

const PASSWORD = 'Password123!';
const ROUNDS = 12;
const TEST_DOMAIN = '@test.local';
const TEST_TAG = '[TEST] ';

// 67-byte 1×1 white PNG.
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

// Minimal valid 1-page blank PDF (~280 bytes).
const PDF_BYTES = Buffer.from(
  `%PDF-1.4
1 0 obj
<</Type/Catalog/Pages 2 0 R>>
endobj
2 0 obj
<</Type/Pages/Count 1/Kids[3 0 R]>>
endobj
3 0 obj
<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>
endobj
xref
0 4
0000000000 65535 f
0000000010 00000 n
0000000053 00000 n
0000000102 00000 n
trailer
<</Size 4/Root 1 0 R>>
startxref
160
%%EOF
`,
  'binary'
);

interface CompanySpec {
  key: string;
  companyName: string;
  email: string;
  userName: string;
  role: UserRole;
  status: CompanyVerifStatus;
  attachDocs: boolean;
  decisionReason?: string;
}

const COMPANIES: CompanySpec[] = [
  {
    key: 'adv-fresh',
    companyName: 'Fresh Advertisers',
    email: `advertiser.fresh${TEST_DOMAIN}`,
    userName: 'Fresh Anush',
    role: 'ADVERTISER',
    status: 'PENDING',
    attachDocs: false,
  },
  {
    key: 'adv-pending',
    companyName: 'Pending Brews',
    email: `advertiser.pending${TEST_DOMAIN}`,
    userName: 'Pending Petros',
    role: 'ADVERTISER',
    status: 'PENDING',
    attachDocs: true,
  },
  {
    key: 'adv-needsinfo',
    companyName: 'NeedsInfo Foods',
    email: `advertiser.needsinfo${TEST_DOMAIN}`,
    userName: 'NeedsInfo Narek',
    role: 'ADVERTISER',
    status: 'NEEDS_INFO',
    attachDocs: true,
    decisionReason: 'Send a clearer scan of the tax registration certificate.',
  },
  {
    key: 'adv-rejected',
    companyName: 'Rejected Goods',
    email: `advertiser.rejected${TEST_DOMAIN}`,
    userName: 'Rejected Ruben',
    role: 'ADVERTISER',
    status: 'REJECTED',
    attachDocs: true,
    decisionReason: 'Company registration number does not match the document provided.',
  },
  {
    key: 'adv-approved',
    companyName: 'Approved Drinks',
    email: `advertiser.approved${TEST_DOMAIN}`,
    userName: 'Approved Anahit',
    role: 'ADVERTISER',
    status: 'APPROVED',
    attachDocs: true,
  },
  {
    key: 'pub-approved',
    companyName: 'Approved Publishers',
    email: `publisher.approved${TEST_DOMAIN}`,
    userName: 'Approved Davit',
    role: 'PUBLISHER',
    status: 'APPROVED',
    attachDocs: true,
  },
];

async function wipeFixture(): Promise<void> {
  const testUsers = await prisma.user.findMany({
    where: { email: { endsWith: TEST_DOMAIN } },
    select: { id: true, companyId: true },
  });
  const testUserIds = testUsers.map((u) => u.id);
  const companyIdsFromUsers = testUsers
    .map((u) => u.companyId)
    .filter((id): id is string => Boolean(id));

  const testCompanies = await prisma.company.findMany({
    where: {
      OR: [
        { name: { startsWith: TEST_TAG } },
        ...(companyIdsFromUsers.length ? [{ id: { in: companyIdsFromUsers } }] : []),
      ],
    },
    select: { id: true },
  });
  const testCompanyIds = testCompanies.map((c) => c.id);

  // Inquiries reference companies/users via Restrict — clear them first.
  if (testCompanyIds.length) {
    const inquiries = await prisma.inquiry.findMany({
      where: {
        OR: [
          { advertiserCompanyId: { in: testCompanyIds } },
          { publisherCompanyId: { in: testCompanyIds } },
        ],
      },
      select: { id: true },
    });
    const inquiryIds = inquiries.map((i) => i.id);
    if (inquiryIds.length) {
      await prisma.inquiryAuditEntry.deleteMany({
        where: { inquiryId: { in: inquiryIds } },
      });
      await prisma.inquiry.deleteMany({ where: { id: { in: inquiryIds } } });
    }
    await prisma.listing.deleteMany({ where: { companyId: { in: testCompanyIds } } });
    await prisma.verificationRequest.deleteMany({
      where: { companyId: { in: testCompanyIds } },
    });
    await prisma.companyIndustry.deleteMany({
      where: { companyId: { in: testCompanyIds } },
    });
    await prisma.sourceChannel.deleteMany({
      where: { ownerCompanyId: { in: testCompanyIds } },
    });
  }

  if (testUserIds.length) {
    // Detach users from companies before deleting (User.companyId is Restrict).
    await prisma.user.updateMany({
      where: { id: { in: testUserIds } },
      data: { companyId: null },
    });
    await prisma.notification.deleteMany({ where: { userId: { in: testUserIds } } });
    await prisma.verificationToken.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    await prisma.passwordResetToken.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
  }

  if (testCompanyIds.length) {
    await prisma.company.deleteMany({ where: { id: { in: testCompanyIds } } });
  }
}

async function writePlaceholderDocs(
  companyId: string
): Promise<Prisma.InputJsonValue> {
  const dir = path.join(
    process.cwd(),
    'storage',
    'uploads',
    'companies',
    companyId,
    'verification'
  );
  await mkdir(dir, { recursive: true });

  const pdfName = 'registration.pdf';
  const pngName = 'logo.png';
  await writeFile(path.join(dir, pdfName), PDF_BYTES);
  await writeFile(path.join(dir, pngName), PNG_BYTES);

  return [
    {
      path: `companies/${companyId}/verification/${pdfName}`,
      mimeType: 'application/pdf',
      originalName: 'Company registration.pdf',
      size: PDF_BYTES.length,
    },
    {
      path: `companies/${companyId}/verification/${pngName}`,
      mimeType: 'image/png',
      originalName: 'Office sign.png',
      size: PNG_BYTES.length,
    },
  ] as unknown as Prisma.InputJsonValue;
}

async function createFixtureCompany(
  spec: CompanySpec,
  passwordHash: string
): Promise<{ userId: string; companyId: string }> {
  const company = await prisma.company.create({
    data: {
      name: `${TEST_TAG}${spec.companyName}`,
      legalName: `${spec.companyName} LLC`,
      taxId: '01234567',
      type: 'LLC',
      foundingYear: 2020,
      country: 'AM',
      address: '15 Mashtots Ave, Yerevan',
      verificationStatus: spec.status,
      verifiedAt: spec.status === 'APPROVED' ? new Date() : null,
      canAdvertise: spec.status === 'APPROVED' && spec.role === 'ADVERTISER',
      canPublish: spec.status === 'APPROVED' && spec.role === 'PUBLISHER',
    },
  });

  const user = await prisma.user.create({
    data: {
      email: spec.email,
      passwordHash,
      name: spec.userName,
      role: spec.role,
      emailVerified: new Date(),
      companyId: company.id,
    },
  });

  if (spec.attachDocs) {
    const documents = await writePlaceholderDocs(company.id);
    await prisma.verificationRequest.create({
      data: {
        companyId: company.id,
        documents,
        decision:
          spec.status === 'PENDING'
            ? null
            : (spec.status as 'APPROVED' | 'REJECTED' | 'NEEDS_INFO'),
        decisionReason: spec.decisionReason ?? null,
        reviewedAt: spec.status === 'PENDING' ? null : new Date(),
      },
    });
  }

  return { userId: user.id, companyId: company.id };
}

interface InquirySpec {
  status: InquiryStatus;
  assignTo?: 'admin1' | null;
  slaOffsetMs?: number; // relative to now, can be negative for breach
  closeReason?: string;
  campaignGoal?: string;
}

const INQUIRY_SPECS: InquirySpec[] = [
  {
    status: 'NEW',
    assignTo: null,
    slaOffsetMs: 4 * 60 * 60 * 1000, // 4h left
    campaignGoal: 'Drinks campaign for the summer launch — pilot run, looking for radio spots.',
  },
  {
    status: 'NEW',
    assignTo: null,
    slaOffsetMs: -2 * 60 * 60 * 1000, // breached 2h ago
    campaignGoal: 'Brand awareness push for Q3, evening drive-time preferred.',
  },
  {
    status: 'ASSIGNED',
    assignTo: 'admin1',
    slaOffsetMs: 45 * 60 * 1000, // urgent (<1h)
    campaignGoal: 'Need a quick fill for an August promo — 30 spots, mid-budget.',
  },
  {
    status: 'IN_PROGRESS',
    assignTo: 'admin1',
    slaOffsetMs: 6 * 60 * 60 * 1000,
    campaignGoal: 'Detailed brief attached. Awaiting publisher pricing.',
  },
  {
    status: 'AWAITING_PUBLISHER',
    assignTo: 'admin1',
    slaOffsetMs: 3 * 60 * 60 * 1000,
  },
  {
    status: 'AWAITING_ADVERTISER',
    assignTo: 'admin1',
    slaOffsetMs: 90 * 60 * 1000,
  },
  {
    status: 'CONFIRMED',
    assignTo: 'admin1',
  },
  {
    status: 'LOST',
    assignTo: 'admin1',
    closeReason: 'Advertiser went with a different channel mix.',
  },
  {
    status: 'CANCELLED',
    assignTo: null,
    closeReason: 'Advertiser asked us to pause the request indefinitely.',
  },
];

async function main(): Promise<void> {
  const owner = await prisma.user.findFirst({
    where: { role: 'ADMIN', email: { not: { endsWith: TEST_DOMAIN } } },
    select: { id: true, email: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!owner) {
    console.error(
      'No admin user found. Run `npm run db:create-admin -- <email> <name> <password>` first.'
    );
    process.exit(1);
  }

  console.info('[seed-test] Wiping previous fixture...');
  await wipeFixture();

  console.info('[seed-test] Creating companies + users...');
  const passwordHash = await bcrypt.hash(PASSWORD, ROUNDS);
  const created: Record<string, { userId: string; companyId: string }> = {};
  for (const spec of COMPANIES) {
    created[spec.key] = await createFixtureCompany(spec, passwordHash);
    console.info(`  · ${spec.email} → ${spec.status}`);
  }

  // Listing on the approved publisher to anchor inquiries.
  const listing = await prisma.listing.create({
    data: {
      companyId: created['pub-approved'].companyId,
      title: `${TEST_TAG}Morning drive — Radio Test`,
      channelType: 'RADIO',
      availableFrom: new Date(),
      availableTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      audienceDemographics: { region: 'Yerevan', dailyReach: 50000, ageRange: '25-44' },
      description: 'Test listing for the morning drive slot, 7–9am weekdays.',
      status: 'ACTIVE',
    },
  });
  console.info(`  · listing ${listing.id.slice(-8)} → ACTIVE`);

  console.info('[seed-test] Creating inquiries...');
  const advertiserCompany = created['adv-approved'].companyId;
  const advertiserUser = created['adv-approved'].userId;
  const publisherCompany = created['pub-approved'].companyId;
  for (const [i, spec] of INQUIRY_SPECS.entries()) {
    const closedStates: InquiryStatus[] = ['CONFIRMED', 'LOST', 'CANCELLED'];
    const isClosed = closedStates.includes(spec.status);
    const inq = await prisma.inquiry.create({
      data: {
        advertiserUserId: advertiserUser,
        advertiserCompanyId: advertiserCompany,
        publisherCompanyId: publisherCompany,
        listingId: i % 2 === 0 ? listing.id : null,
        assignedAdminId: spec.assignTo === 'admin1' ? owner.id : null,
        status: spec.status,
        campaignGoal:
          spec.campaignGoal ?? `Generic test inquiry #${i + 1} for the ${spec.status} state.`,
        slaDeadline:
          isClosed || spec.slaOffsetMs === undefined
            ? null
            : new Date(Date.now() + spec.slaOffsetMs),
        closeReason: spec.closeReason ?? null,
        closedAt: isClosed ? new Date() : null,
        createdAt: new Date(Date.now() - (INQUIRY_SPECS.length - i) * 60 * 60 * 1000),
      },
    });
    await prisma.inquiryAuditEntry.create({
      data: {
        inquiryId: inq.id,
        action: 'SEED',
        toStatus: spec.status,
      },
    });
    console.info(`  · INQ-${inq.id.slice(-8)} → ${spec.status}`);
  }

  console.info('\n[seed-test] Done.');
  console.info('--------------------------------------------------');
  console.info('Test accounts (password for all): Password123!');
  for (const spec of COMPANIES) {
    console.info(`  ${spec.role.padEnd(11)} ${spec.status.padEnd(10)} ${spec.email}`);
  }
  console.info('\nAdmin for review:');
  console.info(`  ADMIN                  ${owner.email}`);
  console.info('--------------------------------------------------');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
