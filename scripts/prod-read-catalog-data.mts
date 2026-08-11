// One-off read-only prod probe: what the catalog's two dead facets need.
// Run: npx tsx scripts/prod-read-catalog-data.mts
// Reads .env.hostinger and swaps 127.0.0.1 -> srv2026.hstgr.io (the prod DB is
// only reachable from outside under that host, see docs/DEPLOY-PLAYBOOK.md).
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const env = fs.readFileSync(".env.hostinger", "utf8");
const raw = env.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
if (!raw) throw new Error("DATABASE_URL not found in .env.hostinger");
const url = raw.replace("127.0.0.1", "srv2026.hstgr.io");

const prisma = new PrismaClient({ datasources: { db: { url } } });

const placements = await prisma.placement.findMany({
  select: {
    id: true,
    projectId: true,
    title: true,
    titleHy: true,
    titleRu: true,
    titleEn: true,
    description: true,
    placementType: true,
    priceAmd: true,
    project: { select: { title: true, code: true } },
  },
  orderBy: [{ projectId: "asc" }, { sortOrder: "asc" }],
});

console.log(`PLACEMENTS: ${placements.length}`);
for (const p of placements) {
  const desc = (p.description ?? "").replace(/\s+/g, " ").slice(0, 120);
  console.log(
    [
      `#${p.id}`,
      `proj=${p.projectId} "${p.project.title}"`,
      `type=${p.placementType ?? "—"}`,
      `price=${p.priceAmd ?? "—"}`,
      `hy="${p.titleHy || p.title}"`,
      `ru="${p.titleRu}"`,
      `en="${p.titleEn}"`,
      `desc="${desc}"`,
    ].join(" | "),
  );
}

const adSpaces = await prisma.adSpace.count();
const owners = await prisma.user.count();
console.log(`\nAD_SPACES: ${adSpaces}`);
console.log(`USERS: ${owners}`);

await prisma.$disconnect();
