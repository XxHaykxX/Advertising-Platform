// Read-only check that every /uploads/… path a LIVE database row points at
// actually exists in storage — the "is the SITE complete" counterpart to
// verify-uploads-parity.mjs, which only proves the FILE COPY is complete. A
// file that was already missing on Hostinger, or deleted from disk while its
// row survived, passes that check and still renders a broken image after the
// cutover.
//
// Reuses the extractor the history feature already built instead of
// hand-listing which columns can hold a path (single paths, JSON arrays,
// per-locale JSON — collectMediaPaths regex-scans the serialized row, so it
// doesn't care which shape it is): src/lib/history/snapshot.ts. Existence is
// checked through the storage driver (src/lib/storage), not S3 calls of its
// own — so this runs unchanged against STORAGE_DRIVER=fs (Hostinger's synced
// copy, a pre-migration baseline) or STORAGE_DRIVER=s3 (the bucket, post-sync).
//
// `--conditions=react-server` is required: both modules above carry the
// "server-only" guard for the Next bundler, which throws on a plain import —
// that condition tells Node to resolve it to the (empty) RSC build instead.
//
// Run:
//   npx tsx --conditions=react-server scripts/aws/verify-media-refs.mts
//   STORAGE_DRIVER=s3 S3_BUCKET=… npx tsx --conditions=react-server scripts/aws/verify-media-refs.mts
import { PrismaClient } from "@prisma/client";
import { buildSnapshot, collectMediaPaths, HISTORY_ENTITIES, type HistoryEntity } from "@/lib/history/snapshot";
import { storage, publicPathToKey } from "@/lib/storage";

const prisma = new PrismaClient();

type Delegate = { findMany: (args: unknown) => Promise<{ id: number }[]> };
function delegate(entity: HistoryEntity): Delegate {
  const name = entity.charAt(0).toLowerCase() + entity.slice(1);
  return (prisma as unknown as Record<string, Delegate>)[name];
}

/** path -> labels ("Project#12") of every live row that mentions it. */
async function collectReferenced(): Promise<Map<string, string[]>> {
  const refs = new Map<string, string[]>();
  const add = (path: string, label: string) => {
    const list = refs.get(path);
    if (list) list.push(label);
    else refs.set(path, [label]);
  };

  for (const entity of HISTORY_ENTITIES) {
    const rows = await delegate(entity).findMany({ select: { id: true } });
    for (const { id } of rows) {
      const snapshot = await buildSnapshot(prisma, entity, id);
      if (!snapshot) continue;
      for (const p of collectMediaPaths(snapshot)) add(p, `${entity}#${id}`);
    }
  }

  // User isn't a HistoryEntity, so the loop above never sees it — same
  // exception src/lib/uploads-usage.ts makes for the same reason. avatar can
  // also be an external URL or data-URL (see the schema comment), hence the
  // regex rather than treating every non-null value as a path.
  const users = await prisma.user.findMany({ where: { avatar: { not: null } }, select: { id: true, avatar: true } });
  for (const u of users) {
    for (const p of u.avatar?.match(/\/uploads\/[A-Za-z0-9._\-/]+/g) ?? []) add(p, `User#${u.id}`);
  }

  return refs;
}

async function main() {
  const refs = await collectReferenced();
  console.log(`${refs.size} distinct /uploads/… paths referenced by live rows\n`);

  const store = storage();

  const missing: [string, string[]][] = [];
  for (const [p, labels] of refs) {
    const key = publicPathToKey(p);
    const found = key ? await store.head(key) : null;
    if (!found) missing.push([p, labels]);
  }
  console.log(`referenced but missing (${missing.length}) — broken on the live site:`);
  for (const [p, labels] of missing) console.log(`  ${p}  <- ${labels.join(", ")}`);
  if (!missing.length) console.log("  none");

  // Cheap here because list() already walks the whole tree once for this
  // report — informational only, this list never fails the run.
  const stored = await store.list("");
  const referencedKeys = new Set(
    [...refs.keys()].map(publicPathToKey).filter((k): k is string => k !== null),
  );
  const orphans = stored.filter((f) => !referencedKeys.has(f.key));
  console.log(`\npresent but referenced by nothing (${orphans.length}) — harmless, wasted storage only:`);
  for (const f of orphans.slice(0, 50)) console.log(`  ${f.key}`);
  if (orphans.length > 50) console.log(`  … and ${orphans.length - 50} more`);

  await prisma.$disconnect();

  if (missing.length) {
    console.error("\nmedia-refs check FAILED — broken references exist.");
    process.exit(1);
  }
  console.log("\nmedia-refs OK.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
