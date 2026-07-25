// One-off data migration for the Platforms + Streaming source -> "Available on"
// merge (task #29). For every project, fold any streamingSource values that
// aren't already in platforms into platforms (both stored as JSON string[] or
// null). Idempotent. Run against a DB by passing DATABASE_URL, e.g.:
//   node scripts/merge-streaming-into-platforms.mjs                 (local .env)
//   DATABASE_URL="mysql://…prod…" node scripts/merge-streaming-into-platforms.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseList(json) {
  if (!json) return [];
  try {
    const a = JSON.parse(json);
    return Array.isArray(a) ? a.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

const rows = await prisma.project.findMany({
  select: { id: true, platforms: true, streamingSource: true },
});
let changed = 0;
for (const r of rows) {
  const plat = parseList(r.platforms);
  const stream = parseList(r.streamingSource);
  const merged = [...new Set([...plat, ...stream])];
  if (merged.length !== plat.length) {
    await prisma.project.update({
      where: { id: r.id },
      data: { platforms: merged.length ? JSON.stringify(merged) : null },
    });
    changed++;
  }
}
console.log(`merged streamingSource -> platforms on ${changed}/${rows.length} projects`);
await prisma.$disconnect();
