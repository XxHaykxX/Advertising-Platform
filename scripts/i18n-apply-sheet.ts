/* One-off importer for the localization spreadsheet (2026-07-27).
 *
 * Mariam reviewed the whole dictionary in the Google Sheet and marked rows by
 * colour: green = "this text changed", red = "this element should go". The CSV
 * export carries no colours, so the sheet is read as .xlsx (which stores the
 * fill) and the marked rows are pulled out here.
 *
 * Only the GREEN rows are applied, and only to keys that already exist — the
 * red ones and the keys she added are code changes, made by hand alongside
 * this run. The rewrite goes through the same rewriteDictionarySource() the
 * in-admin editor publishes with, so the diff stays reviewable and the file's
 * formatting survives.
 *
 * Usage: npx tsx scripts/i18n-apply-sheet.ts <marks.json> [--dry]
 * where marks.json is {green: [{key, values:{hy,ru,en}}]} produced from the xlsx.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { UI } from "../src/lib/i18n";
import { rewriteDictionarySource, type Values } from "../src/lib/i18n-rewrite";

const DICT = "src/lib/i18n.ts";

type Mark = { key: string; values: Values };

const marksPath = process.argv[2];
const dry = process.argv.includes("--dry");
if (!marksPath) {
  console.error("usage: tsx scripts/i18n-apply-sheet.ts <marks.json> [--dry]");
  process.exit(1);
}

const marks: Mark[] = JSON.parse(readFileSync(marksPath, "utf8")).green;
const updates = new Map<string, Values>();
const unknown: string[] = [];

for (const m of marks) {
  const cur = UI[m.key];
  if (!cur) {
    unknown.push(m.key);
    continue;
  }
  // A blank cell in the sheet means "not reviewed", never "clear this text" —
  // the sheet is missing 213 keys and has empty cells for new ones.
  updates.set(m.key, {
    hy: m.values.hy.trim() || cur.hy,
    ru: m.values.ru.trim() || cur.ru,
    en: m.values.en.trim() || cur.en,
  });
}

const source = readFileSync(DICT, "utf8");
const result = rewriteDictionarySource(source, updates, UI);

console.log(`marked: ${marks.length}, applied: ${result.changed.length}, unknown keys: ${unknown.length}`);
if (unknown.length) console.log("unknown (need to be added to the code first):", unknown.join(", "));
console.log("per locale:", result.perLocale);
for (const key of result.changed) console.log("  ", key);

if (dry) {
  console.log("\n--dry: nothing written");
} else {
  writeFileSync(DICT, result.source, "utf8");
  console.log(`\nwritten to ${DICT}`);
}
