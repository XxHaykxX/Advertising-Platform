import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { GARM_CATEGORIES, SEED_PROJECTS } from "./seed-data";

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

  // 2. Projects (+ nested safety cats + opportunities)
  await prisma.project.deleteMany();
  for (const [i, p] of SEED_PROJECTS.entries()) {
    await prisma.project.create({
      data: {
        code: p.code, title: p.title, genre: p.genre, synopsis: p.synopsis,
        poster: p.poster, gallery: JSON.stringify(p.gallery),
        format: p.format, studio: p.studio, status: p.status,
        releaseLabel: p.releaseLabel, countries: p.countries,
        audienceGender: p.audienceGender, audienceAge: p.audienceAge,
        projViews: p.projViews, cpmRange: p.cpmRange, budgetRange: p.budgetRange,
        safetyScore: p.safetyScore, safety: p.safety, sortOrder: i, ownerId: admin.id,
        safetyCats: {
          create: GARM_CATEGORIES.map((name, idx) => ({
            name, score: p.catScores[idx] ?? 90, aiText: "", sortOrder: idx,
          })),
        },
        opportunities: {
          create: p.opps.map((o, idx) => ({ ...o, sortOrder: idx })),
        },
      },
    });
  }

  // 3. Settings (default locale)
  await prisma.setting.upsert({
    where: { key: "default_lang" }, update: {}, create: { key: "default_lang", value: "en" },
  });

  console.log(`Seeded: admin + ${SEED_PROJECTS.length} projects`);
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
