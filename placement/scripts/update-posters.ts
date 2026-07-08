/**
 * One-off: replace seeded Unsplash poster URLs with local /posters assets
 * and populate the `gallery` field (JSON string[]) with storyboard thumbnails.
 *
 * Usage: npx tsx scripts/update-posters.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const poster = (n: number) => `/posters/poster-${String(n).padStart(2, "0")}.jpg`;

// Ordered to match seed-data.ts SEED_PROJECTS order.
const ASSIGNMENTS: { code: string; posterNo: number; galleryNos: number[] }[] = [
  { code: "#PP-2026-8540", posterNo: 1, galleryNos: [2, 3, 5, 6, 8] }, // Bandwidth
  { code: "#PP-2026-5657", posterNo: 4, galleryNos: [9, 11, 12, 14, 15] }, // Code Bracelet
  { code: "#PP-2026-2384", posterNo: 7, galleryNos: [17, 18, 19, 20, 21] }, // Cold Case Files Active
  { code: "#PP-2026-9012", posterNo: 10, galleryNos: [22, 23, 24, 2, 3] }, // The Longest Night
  { code: "#PP-2026-3345", posterNo: 13, galleryNos: [5, 6, 8, 9, 11] }, // Saffron Road
  { code: "#PP-2026-7788", posterNo: 16, galleryNos: [12, 14, 15, 17, 18] }, // Ironwood County
];

async function main() {
  for (const { code, posterNo, galleryNos } of ASSIGNMENTS) {
    const gallery = galleryNos.map(poster);
    const result = await prisma.project.updateMany({
      where: { code },
      data: { poster: poster(posterNo), gallery: JSON.stringify(gallery) },
    });
    console.log(`${code}: updated ${result.count} row(s) — poster=${poster(posterNo)}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
