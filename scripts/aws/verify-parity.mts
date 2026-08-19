// Read-only parity check between two databases, run before a DNS cutover —
// proves the RDS copy is complete so nobody switches DNS to a half-migrated
// database.
//
// Run: npx tsx scripts/aws/verify-parity.mts
// Requires SOURCE_DATABASE_URL (Hostinger) and TARGET_DATABASE_URL (RDS) in
// the environment; refuses to run without both. Never writes to either side —
// every call below is count/aggregate/findMany.
import { Prisma, PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;
if (!sourceUrl || !targetUrl) {
  console.error("missing env var: SOURCE_DATABASE_URL and/or TARGET_DATABASE_URL");
  process.exit(1);
}

const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
const target = new PrismaClient({ datasources: { db: { url: targetUrl } } });

// Same derivation as src/lib/history/restore.ts: pull the model list from the
// DMMF instead of hardcoding it, so a new model is covered the day it lands
// instead of the day someone remembers to add it here.
const models = Prisma.dmmf.datamodel.models;

// A handful of the largest/highest-risk tables also get a content checksum —
// counts alone pass a migration that copied the right number of wrong rows.
// Columns are a couple of stable, present scalars per model (not
// updatedAt-style — this checks the copy, not later drift).
const CHECKSUM_COLUMNS: Record<string, [string, string]> = {
  Project: ["title", "code"],
  Placement: ["title", "priceAmd"],
  AdSpace: ["title", "code"],
  Interest: ["status", "brandId"],
  User: ["email", "role"],
};

type Delegate = {
  count: () => Promise<number>;
  aggregate: (args: unknown) => Promise<Record<string, Record<string, unknown>>>;
  findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
};

function delegate(client: PrismaClient, modelName: string): Delegate {
  const name = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  return (client as unknown as Record<string, Delegate>)[name];
}

type IdField = { name: string; kind: "int" | "string" };

function idField(model: (typeof models)[number]): IdField | null {
  const f = model.fields.find((f) => f.isId);
  if (!f) return null;
  if (f.type === "Int") return { name: f.name, kind: "int" };
  if (f.type === "String") return { name: f.name, kind: "string" };
  return null; // composite/other PK — not expected in this schema, skip rather than guess
}

async function countAndMax(client: PrismaClient, model: (typeof models)[number], id: IdField | null) {
  const d = delegate(client, model.name);
  const count = await d.count();
  if (!id || id.kind !== "int") return { count, max: "—" }; // string PK: no meaningful "max"
  const agg = await d.aggregate({ _max: { [id.name]: true } });
  return { count, max: String(agg._max[id.name] ?? "—") };
}

async function checksum(client: PrismaClient, modelName: string, id: IdField, columns: string[]): Promise<string> {
  const d = delegate(client, modelName);
  const rows = await d.findMany({
    select: { [id.name]: true, ...Object.fromEntries(columns.map((c) => [c, true])) },
    orderBy: { [id.name]: "asc" },
  });
  const material = rows.map((r) => [r[id.name], ...columns.map((c) => r[c])].join("|")).join("\n");
  return crypto.createHash("sha256").update(material).digest("hex").slice(0, 16);
}

async function main() {
  console.log(`comparing ${models.length} models\n`);
  let failed = false;

  type Row = { model: string; srcCount: number; dstCount: number; srcMax: string; dstMax: string; ok: boolean };
  const rows: Row[] = [];
  for (const model of models) {
    const id = idField(model);
    const [src, dst] = await Promise.all([countAndMax(source, model, id), countAndMax(target, model, id)]);
    const ok = src.count === dst.count && src.max === dst.max;
    if (!ok) failed = true;
    rows.push({ model: model.name, srcCount: src.count, dstCount: dst.count, srcMax: src.max, dstMax: dst.max, ok });
  }

  const w = Math.max(...rows.map((r) => r.model.length), "model".length);
  console.log(`${"model".padEnd(w)}  src count  dst count  src max  dst max  verdict`);
  for (const r of rows) {
    console.log(
      `${r.model.padEnd(w)}  ${String(r.srcCount).padStart(9)}  ${String(r.dstCount).padStart(9)}  ` +
        `${r.srcMax.padStart(7)}  ${r.dstMax.padStart(7)}  ${r.ok ? "OK" : "MISMATCH"}`,
    );
  }

  console.log("\ncontent checksums (largest/riskiest tables, not just counts):");
  for (const [modelName, columns] of Object.entries(CHECKSUM_COLUMNS)) {
    const model = models.find((m) => m.name === modelName);
    const id = model ? idField(model) : null;
    if (!model || !id || id.kind !== "int") {
      console.log(`  ${modelName}: skipped (model or int id not found)`);
      continue;
    }
    const [a, b] = await Promise.all([
      checksum(source, modelName, id, columns),
      checksum(target, modelName, id, columns),
    ]);
    const ok = a === b;
    if (!ok) failed = true;
    console.log(`  ${modelName.padEnd(w)}  src=${a}  dst=${b}  ${ok ? "OK" : "MISMATCH"}`);
  }

  await source.$disconnect();
  await target.$disconnect();

  if (failed) {
    console.error("\nparity check FAILED — do not switch DNS.");
    process.exit(1);
  }
  console.log("\nparity OK.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
