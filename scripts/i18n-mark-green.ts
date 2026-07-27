/* Mark dictionary rows green in the in-admin editor (2026-07-27).
 *
 * The colour marks in /admin/i18n are the translator's own review state — they
 * live on UiDraft rows and survive publishing (see pruneSettledDrafts in the
 * i18n admin page). This writes them for the keys that came out of the
 * localization sheet, so the editor shows at a glance what has already been
 * dealt with and nobody redoes the same rows.
 *
 * The values written are the ones currently in the code, so the row is NOT a
 * pending edit — just a marked, settled row. Run this AFTER the matching code
 * is live, otherwise the editor will (correctly) report the rows as unpublished
 * edits until the build lands.
 *
 * Usage: npx tsx scripts/i18n-mark-green.ts <keys.txt> ["note"]
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { UI } from "../src/lib/i18n";

const prisma = new PrismaClient();

async function main() {
  const keysPath = process.argv[2];
  const note = process.argv[3] ?? "";
  if (!keysPath) {
    console.error('usage: tsx scripts/i18n-mark-green.ts <keys.txt> ["note"]');
    process.exit(1);
  }

  const keys = readFileSync(keysPath, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  const unknown = keys.filter((k) => !UI[k]);
  if (unknown.length) console.log("skipped (not in the dictionary):", unknown.join(", "));

  let written = 0;
  for (const key of keys) {
    const v = UI[key];
    if (!v) continue;
    await prisma.uiDraft.upsert({
      where: { key },
      create: { key, hy: v.hy, ru: v.ru, en: v.en, mark: "GREEN", note: note || null },
      // Never clobber an edit someone is in the middle of: only the mark and
      // the note are forced, the text stays whatever the row already holds.
      update: { mark: "GREEN", ...(note ? { note } : {}) },
    });
    written++;
  }
  console.log(`marked green: ${written}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
