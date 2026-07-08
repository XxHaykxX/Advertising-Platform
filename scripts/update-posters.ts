/**
 * One-off: set project posters + gallery to real stills scraped from
 * kinodaran.com (stored locally under public/kino). Projects are matched by
 * ascending sortOrder to proj-01..06 / frame-NN.
 *
 * Usage: npx tsx scripts/update-posters.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({ orderBy: { sortOrder: "asc" } });
  for (let i = 0; i < projects.length; i++) {
    const n = String(i + 1).padStart(2, "0");
    const gallery = Array.from({ length: 5 }, (_, k) =>
      `/kino/frame-${String(i * 5 + k + 1).padStart(2, "0")}.jpg`,
    );
    await prisma.project.update({
      where: { id: projects[i].id },
      data: { poster: `/kino/proj-${n}-hero.jpg`, gallery: JSON.stringify(gallery) },
    });
    console.log(`${projects[i].title} -> /kino/proj-${n}-hero.jpg (+${gallery.length} frames)`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
