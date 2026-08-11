// One-off read-only prod probe: how filled-in the storefront actually is.
// Run: npx tsx scripts/prod-read-offer-gaps.mts
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const raw = fs.readFileSync(".env.hostinger", "utf8").match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
if (!raw) throw new Error("DATABASE_URL not found in .env.hostinger");
const prisma = new PrismaClient({
  datasources: { db: { url: raw.replace("127.0.0.1", "srv2026.hstgr.io") } },
});

const projects = await prisma.project.findMany({
  where: { isActive: true },
  select: {
    id: true,
    title: true,
    taglineRu: true,
    taglineEn: true,
    synopsisRu: true,
    synopsisEn: true,
    tiers: { select: { id: true, priceAmd: true, benefits: true } },
    placements: { select: { id: true, priceAmd: true, description: true } },
  },
  orderBy: { id: "asc" },
});

const isEmptyList = (v: string | null) => {
  if (!v) return true;
  try {
    const arr = JSON.parse(v);
    return !Array.isArray(arr) || arr.length === 0 || arr.every((x) => !String(x).trim());
  } catch {
    return !v.trim();
  }
};

let tiers = 0, tiersNoPrice = 0, tiersNoBenefits = 0;
let plc = 0, plcNoPrice = 0, plcNoDesc = 0;
let noRuEn = 0;

for (const p of projects) {
  const missingText = !p.taglineRu?.trim() || !p.taglineEn?.trim() || !p.synopsisRu?.trim() || !p.synopsisEn?.trim();
  if (missingText) noRuEn++;
  for (const t of p.tiers) {
    tiers++;
    if (t.priceAmd == null) tiersNoPrice++;
    if (isEmptyList(t.benefits)) tiersNoBenefits++;
  }
  for (const pl of p.placements) {
    plc++;
    if (pl.priceAmd == null) plcNoPrice++;
    if (isEmptyList(pl.description)) plcNoDesc++;
  }
}

console.log(`ACTIVE PROJECTS: ${projects.length}`);
console.log(`  without ru/en tagline+synopsis: ${noRuEn}`);
console.log(`SPONSORSHIP TIERS: ${tiers} | no price: ${tiersNoPrice} | no "what's included": ${tiersNoBenefits}`);
console.log(`PLACEMENTS: ${plc} | no price: ${plcNoPrice} | no description: ${plcNoDesc}`);

await prisma.$disconnect();
