/* Import the content writer's Google Sheet back into src/lib/i18n.ts.

   Usage: npm run i18n:import           (reads I18N_SHEET_CSV_URL — env first,
                                         .env file as local fallback)
          npm run i18n:import -- <file> (reads a local CSV — used for the
                                         round-trip self-test)

   The sheet must be shared "anyone with the link → viewer"; the URL is the
   CSV export form:
   https://docs.google.com/spreadsheets/d/<ID>/export?format=csv[&gid=0]

   Safety: validates everything BEFORE touching i18n.ts (key set matches,
   no empty cells, {placeholders} preserved, no Cyrillic homoglyphs in hy)
   and rewrites ONLY the entries whose values actually changed — section
   comments and untouched lines keep their exact formatting, so the git
   diff stays reviewable. src/lib/i18n.guard.test.ts remains the final
   gate after an import. */

import { readFileSync, writeFileSync } from "node:fs";
import { UI, type Locale } from "../src/lib/i18n";
import { CSV_HEADER, parseCsv } from "./i18n-lib";
import { validateBatch } from "../src/lib/i18n-validate";
import { rewriteDictionarySource } from "../src/lib/i18n-rewrite";

const I18N_PATH = new URL("../src/lib/i18n.ts", import.meta.url);

async function loadCsv(): Promise<string> {
  const fileArg = process.argv[2];
  if (fileArg) {
    console.log(`reading local file ${fileArg}`);
    return readFileSync(fileArg, "utf8");
  }
  // CI (GitHub Actions) has no .env file — read the process env first, and
  // only fall back to a minimal .env reader for local runs. No dotenv
  // dependency; .env values may contain '='.
  let url = process.env.I18N_SHEET_CSV_URL?.trim();
  if (!url) {
    try {
      const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
      const line = env.split(/\r?\n/).find((l) => l.startsWith("I18N_SHEET_CSV_URL="));
      url = line?.slice("I18N_SHEET_CSV_URL=".length).trim().replace(/^"|"$/g, "");
    } catch {
      // no .env file (e.g. fresh checkout) — fall through to the error below
    }
  }
  if (!url) {
    console.error(
      "I18N_SHEET_CSV_URL is not set — checked process.env.I18N_SHEET_CSV_URL and .env",
    );
    process.exit(1);
  }
  console.log("fetching sheet CSV…");
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    console.error(`fetch failed: HTTP ${res.status} — is the sheet shared "anyone with link: viewer"?`);
    process.exit(1);
  }
  return await res.text();
}

function fail(errors: string[]): never {
  console.error(`\nIMPORT REJECTED — i18n.ts not modified. ${errors.length} problem(s):\n`);
  for (const e of errors.slice(0, 50)) console.error("  • " + e);
  if (errors.length > 50) console.error(`  … and ${errors.length - 50} more`);
  process.exit(1);
}

async function main() {
const rows = parseCsv(await loadCsv());
if (!rows.length) fail(["sheet is empty"]);

// Header sanity — writer must not reorder/rename columns.
const header = rows[0].map((h) => h.trim());
if (header[0] !== CSV_HEADER[0] || header[2] !== "hy" || header[3] !== "ru" || header[4] !== "en") {
  fail([`unexpected header [${header.join(" | ")}] — expected [${CSV_HEADER.join(" | ")}]`]);
}

/* ── validate ─────────────────────────────────────────────────────────── */

const errors: string[] = [];
const sheet = new Map<string, Record<Locale, string>>();

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const key = (r[0] ?? "").trim();
  if (!key) {
    if (r.every((f) => f.trim() === "")) continue; // stray blank row
    errors.push(`row ${i + 1}: empty key`);
    continue;
  }
  if (sheet.has(key)) {
    errors.push(`row ${i + 1}: duplicate key "${key}"`);
    continue;
  }
  sheet.set(key, { hy: r[2] ?? "", ru: r[3] ?? "", en: r[4] ?? "" });
}

const dictKeys = new Set(Object.keys(UI));
for (const key of dictKeys) {
  if (!sheet.has(key)) errors.push(`key missing from sheet: "${key}" (row deleted?)`);
}
for (const key of sheet.keys()) {
  if (!dictKeys.has(key)) errors.push(`unknown key in sheet: "${key}" (typo in the key column?)`);
}

// Per-value rules (empty cells, Cyrillic homoglyphs in hy, {placeholders})
// live in src/lib/i18n-validate.ts — the same module the in-admin translation
// editor uses, so both writers of the dictionary enforce one rule set.
const known = new Map([...sheet].filter(([key]) => dictKeys.has(key)));
for (const issue of validateBatch(known, UI)) {
  errors.push(`"${issue.key}"${issue.locale ? ` (${issue.locale})` : ""}: ${issue.message}`);
}

if (errors.length) fail(errors);

/* ── rewrite only changed entries in i18n.ts ──────────────────────────── */

// The surgical line-splice rewriter is shared with the in-admin editor —
// src/lib/i18n-rewrite.ts.
let result: { source: string; changed: string[]; perLocale: Record<Locale, number> };
try {
  result = rewriteDictionarySource(readFileSync(I18N_PATH, "utf8"), known, UI);
} catch (e) {
  fail([`internal: ${e instanceof Error ? e.message : String(e)}`]);
}
const { changed, perLocale } = result;

if (!changed.length) {
  console.log(`no changes — sheet matches i18n.ts (${sheet.size} keys checked)`);
  process.exit(0);
}

writeFileSync(I18N_PATH, result.source, "utf8");
console.log(
  `i18n.ts updated: ${changed.length} of ${sheet.size} keys changed ` +
    `(hy ${perLocale.hy}, ru ${perLocale.ru}, en ${perLocale.en})`,
);
console.log("changed keys:\n  " + changed.join("\n  "));
console.log('\nnext: npx vitest run && npx tsc --noEmit, then commit & push to deploy.');
}

main();
