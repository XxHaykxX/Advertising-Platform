import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SEED_PROJECTS, SEED_PORTFOLIO, SEED_PARTNERS } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  // 1. Superadmin (idempotent — never overwrite existing password)
  const existing = await prisma.user.findUnique({ where: { email: "admin@admin.com" } });
  const passwordHash =
    existing?.passwordHash ??
    (await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin1234", 10));
  const admin = await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: { role: "SUPERADMIN", name: "Admin" },
    create: { email: "admin@admin.com", passwordHash, role: "SUPERADMIN", name: "Admin" },
  });

  // 2. Projects (+ nested opportunities)
  await prisma.project.deleteMany();
  for (const [i, p] of SEED_PROJECTS.entries()) {
    await prisma.project.create({
      data: {
        code: p.code, title: p.title, genre: p.genre, synopsis: p.synopsis,
        titleHy: p.titleHy, titleRu: p.titleRu, titleEn: p.titleEn,
        synopsisHy: p.synopsisHy, synopsisRu: p.synopsisRu, synopsisEn: p.synopsisEn,
        poster: p.poster, gallery: JSON.stringify(p.gallery),
        format: p.format, studio: p.studio, status: p.status,
        releaseLabel: p.releaseLabel, countries: p.countries,
        audienceGender: p.audienceGender, audienceAge: p.audienceAge,
        projViews: p.projViews,
        budgetMinAmd: p.budgetMinAmd, budgetMaxAmd: p.budgetMaxAmd,
        cpmMinAmd: p.cpmMinAmd, cpmMaxAmd: p.cpmMaxAmd,
        priceMinAmd: p.priceMinAmd ?? null, priceMaxAmd: p.priceMaxAmd ?? null,
        sortOrder: i, ownerId: admin.id,
        slotsTotal: p.slotsTotal, slotsTaken: p.slotsTaken,
        applicationDeadline: new Date(p.applicationDeadline), releaseDate: new Date(p.releaseDate),
        platforms: JSON.stringify(p.platforms), placementType: p.placementType,
        priceNote: p.priceNote || null,
        opportunities: {
          create: p.opps.map((o, idx) => ({ ...o, sortOrder: idx })),
        },
        actors: {
          create: p.actors.map((a, idx) => ({ ...a, sortOrder: idx })),
        },
      },
    });
  }

  // 3. Portfolio case studies
  await prisma.portfolio.deleteMany();
  for (const [i, c] of SEED_PORTFOLIO.entries()) {
    await prisma.portfolio.create({
      data: {
        title: c.title, brand: c.brand, description: c.description,
        image: c.image, metrics: JSON.stringify(c.metrics), sortOrder: i,
      },
    });
  }

  // 4. Partners
  await prisma.partner.deleteMany();
  for (const [i, p] of SEED_PARTNERS.entries()) {
    await prisma.partner.create({
      data: { name: p.name, logo: p.logo, url: p.url, sortOrder: i },
    });
  }

  // 5. Settings (default locale)
  await prisma.setting.upsert({
    where: { key: "default_lang" }, update: {}, create: { key: "default_lang", value: "en" },
  });

  console.log(
    `Seeded: admin + ${SEED_PROJECTS.length} projects + ${SEED_PORTFOLIO.length} portfolio cases + ${SEED_PARTNERS.length} partners`
  );
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
