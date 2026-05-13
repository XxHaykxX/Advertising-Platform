import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initial industries — Armenian-market-relevant top-level taxonomy.
// Hierarchy is supported by the schema (parentId) but kept flat for MVP;
// admins can add children via S-10.1 admin editor (Phase 3).
const industries: string[] = [
  'Technology',
  'Retail & E-commerce',
  'Healthcare',
  'Finance & Banking',
  'FMCG',
  'Automotive',
  'Real Estate',
  'Education',
  'Entertainment & Media',
  'Telecommunications',
  'Tourism & Hospitality',
  'Energy & Utilities',
  'Manufacturing',
  'Public Sector',
  'Non-profit',
  'Food & Beverage',
  'Fashion & Apparel',
  'Other',
];

async function main() {
  console.info('[seed] upserting industries…');
  for (const name of industries) {
    await prisma.industry.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  const count = await prisma.industry.count();
  console.info(`[seed] industries in DB: ${count}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
