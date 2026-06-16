/* Seed the database from the current static site content.
   Idempotent: wipes catalog/portfolio/partner/setting/content rows and recreates
   them. Applications are never touched. Run: npm run db:seed */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PROJECTS, posterSrc } from "../src/lib/projects";

const prisma = new PrismaClient();

const RU_MONTHS: Record<string, number> = {
  "январь": 0, "января": 0, "февраль": 1, "февраля": 1, "март": 2, "марта": 2,
  "апрель": 3, "апреля": 3, "май": 4, "мая": 4, "июнь": 5, "июня": 5,
  "июль": 6, "июля": 6, "август": 7, "августа": 7, "сентябрь": 8, "сентября": 8,
  "октябрь": 9, "октября": 9, "ноябрь": 10, "ноября": 10, "декабрь": 11, "декабря": 11,
};

/** "Апрель 2026" → Date(2026, 3, 1). Returns null if unparseable. */
function parseReleaseLabel(label: string): Date | null {
  const m = label.trim().toLowerCase().match(/^([а-я]+)\s+(\d{4})$/);
  if (!m) return null;
  const month = RU_MONTHS[m[1]];
  if (month === undefined) return null;
  return new Date(Number(m[2]), month, 1);
}

// ── Portfolio cases (mirrors src/components/sections/portfolio.tsx) ──
const PORTFOLIO = [
  { brand: "AuraDrinks", film: "Северный ветер", description: "Напиток бренда в кадре семейного ужина — органичная интеграция в тёплую сцену.", images: [2, 7, 11], youtube: "aqz-KE-bpKQ" },
  { brand: "NovaTech", film: "Орбита", description: "Гаджеты бренда как техника будущего в космической станции.", images: [11, 5, 8], youtube: "aqz-KE-bpKQ" },
  { brand: "RoadKing", film: "Перекрёсток", description: "Ливрея бренда на болидах и баннеры трассы в ключевых гоночных сценах.", images: [9, 2, 13], youtube: "" },
  { brand: "Lumen Coffee", film: "Тихая гавань", description: "Кофе бренда в домашних сценах — спокойный тон, лояльная аудитория.", images: [13, 7, 4], youtube: "" },
  { brand: "PeakGear", film: "Высота", description: "Экипировка бренда на альпинистах на протяжении всего восхождения.", images: [1, 6, 14], youtube: "aqz-KE-bpKQ" },
];

// ── Partners (mirrors src/components/sections/partners.tsx) ──
const PARTNERS = [
  "NovaTech", "AuraDrinks", "RoadKing", "SkyLine", "Chrono", "LensPro",
  "SonicWave", "PixelPlay", "MarketX", "PeakGear", "Vesta", "Lumen",
];

async function main() {
  // 1. Catalog (cascade removes actors + scenes)
  await prisma.project.deleteMany();
  for (const [i, p] of PROJECTS.entries()) {
    await prisma.project.create({
      data: {
        titleRu: p.title,
        genreRu: p.genre,
        descriptionRu: p.description,
        descriptionEn: "",
        descriptionHy: "",
        placementTypeRu: p.placement,
        poster: posterSrc(p.poster),
        gallery: JSON.stringify(p.gallery.map(posterSrc)),
        price: null,
        currency: null,
        slotsTotal: p.slotsTotal,
        slotsAvailable: p.slotsAvailable,
        releaseDate: parseReleaseLabel(p.release),
        platforms: JSON.stringify(p.platforms),
        bookingDeadline: new Date(p.deadline),
        sortOrder: i,
        isActive: true,
        actors: {
          create: p.actors.map((a, ai) => ({
            firstName: a.firstName,
            lastName: a.lastName,
            role: a.role,
            sortOrder: ai,
          })),
        },
        scenes: {
          create: p.scenes.map((s, si) => ({
            title: s.title,
            description: s.description,
            placement: s.placement,
            // i18n fields default to empty string (filled by admin later)
            descriptionEn: "",
            descriptionHy: "",
            placementEn: "",
            placementHy: "",
            sortOrder: si,
          })),
        },
      },
    });
  }
  console.log(`✓ projects: ${PROJECTS.length}`);

  // 2. Portfolio
  await prisma.portfolio.deleteMany();
  for (const [i, c] of PORTFOLIO.entries()) {
    await prisma.portfolio.create({
      data: {
        titleRu: `${c.brand} × ${c.film}`,
        descriptionRu: c.description,
        descriptionEn: "",
        descriptionHy: "",
        images: JSON.stringify(c.images.map(posterSrc)),
        videoType: c.youtube ? "youtube" : "file",
        videoUrl: c.youtube ? `https://www.youtube.com/watch?v=${c.youtube}` : null,
        sortOrder: i,
      },
    });
  }
  console.log(`✓ portfolio: ${PORTFOLIO.length}`);

  // 3. Partners
  await prisma.partner.deleteMany();
  for (const [i, name] of PARTNERS.entries()) {
    await prisma.partner.create({
      data: { name, url: "#", sortOrder: i },
    });
  }
  console.log(`✓ partners: ${PARTNERS.length}`);

  // 4. Settings — contacts, socials, default lang, admin password hash
  const password = process.env.ADMIN_PASSWORD || "admin1234";
  const hash = await bcrypt.hash(password, 10);
  const settings: Record<string, string> = {
    admin_password_hash: hash,
    default_lang: "ru",
    contact_phone: "+7 999 000-00-00",
    contact_email: "hello@adplacement.example",
    contact_whatsapp: "https://wa.me/79990000000",
    contact_telegram: "https://t.me/placeholder",
    social_instagram: "",
    social_youtube: "",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: key === "admin_password_hash" ? {} : { value }, // don't overwrite an existing password
      create: { key, value },
    });
  }
  console.log(`✓ settings: ${Object.keys(settings).length} (admin password ${"*".repeat(password.length)})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
