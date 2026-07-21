/* Import the content writer's Google Sheet back into src/lib/i18n.ts.

   Usage: npm run i18n:import           (fetches I18N_SHEET_CSV_URL from .env)
          npm run i18n:import -- <file> (reads a local CSV — used for the
                                         round-trip self-test)

   The sheet must be shared "anyone with the link → viewer"; the URL in .env
   is the CSV export form:
   https://docs.google.com/spreadsheets/d/<ID>/export?format=csv[&gid=0]

   Safety: validates everything BEFORE touching i18n.ts (key set matches,
   no empty cells, {placeholders} preserved, no Cyrillic homoglyphs in hy)
   and rewrites ONLY the entries whose values actually changed — section
   comments and untouched lines keep their exact formatting, so the git
   diff stays reviewable. src/lib/i18n.guard.test.ts remains the final
   gate after an import. */

import { readFileSync, writeFileSync } from "node:fs";
import { UI, LOCALES, type Locale } from "../src/lib/i18n";
import { CSV_HEADER, CYRILLIC, parseCsv, placeholders } from "./i18n-lib";

const I18N_PATH = new URL("../src/lib/i18n.ts", import.meta.url);

async function loadCsv(): Promise<string> {
  const fileArg = process.argv[2];
  if (fileArg) {
    console.log(`reading local file ${fileArg}`);
    return readFileSync(fileArg, "utf8");
  }
  // Minimal .env reader — no dotenv dependency; values may contain '='.
  const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
  const line = env.split(/\r?\n/).find((l) => l.startsWith("I18N_SHEET_CSV_URL="));
  const url = line?.slice("I18N_SHEET_CSV_URL=".length).trim().replace(/^"|"$/g, "");
  if (!url) {
    console.error("I18N_SHEET_CSV_URL is not set in .env");
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

for (const [key, vals] of sheet) {
  if (!dictKeys.has(key)) continue;
  for (const loc of LOCALES) {
    if (vals[loc].trim() === "") errors.push(`"${key}": empty ${loc} cell`);
  }
  const hit = vals.hy.match(CYRILLIC);
  if (hit) {
    errors.push(
      `"${key}": Cyrillic character «${hit[0]}» inside the Armenian text (copy-paste homoglyph)`,
    );
  }
  // {token} placeholders must survive translation in every language.
  const expected = placeholders(UI[key].en).join(",");
  for (const loc of LOCALES) {
    const got = placeholders(vals[loc]).join(",");
    if (got !== expected) {
      errors.push(
        `"${key}" (${loc}): placeholders {${got || "—"}} don't match the original {${expected || "—"}}`,
      );
    }
  }
}

if (errors.length) fail(errors);

/* ── rewrite only changed entries in i18n.ts ──────────────────────────── */

const ser = (s: string) => JSON.stringify(s);

/** Entry in the file's existing style: single-line while it fits, otherwise
 *  the multi-line form already used for long entries. `ru:` must come first —
 *  the guard test's duplicate-key regex anchors on `"key": { ru:`. */
function renderEntry(key: string, v: Record<Locale, string>): string {
  const single = `  ${ser(key)}: { ru: ${ser(v.ru)}, en: ${ser(v.en)}, hy: ${ser(v.hy)} },`;
  if (single.length <= 120 && !/[\r\n]/.test(v.ru + v.en + v.hy)) return single;
  return [
    `  ${ser(key)}: {`,
    `    ru: ${ser(v.ru)},`,
    `    en: ${ser(v.en)},`,
    `    hy: ${ser(v.hy)},`,
    `  },`,
  ].join("\n");
}

const src = readFileSync(I18N_PATH, "utf8");
const lines = src.split("\n");
const changed: string[] = [];
const perLocale: Record<Locale, number> = { ru: 0, en: 0, hy: 0 };

for (const [key, vals] of sheet) {
  const cur = UI[key];
  if (cur.ru === vals.ru && cur.en === vals.en && cur.hy === vals.hy) continue;
  changed.push(key);
  for (const loc of LOCALES) if (cur[loc] !== vals[loc]) perLocale[loc]++;

  // Locate the entry: a line starting `  "key": {`; single-line entries end
  // with `},` on that same line, multi-line ones run until an exact `  },`.
  const startRe = new RegExp(`^  ${JSON.stringify(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}: \\{`);
  const start = lines.findIndex((l) => startRe.test(l));
  if (start === -1) fail([`internal: entry for "${key}" not found in i18n.ts source`]);
  let end = start;
  if (!/\},\s*$/.test(lines[start])) {
    while (end < lines.length - 1 && lines[end].trimEnd() !== "  },") end++;
    if (lines[end].trimEnd() !== "  },") fail([`internal: unterminated entry for "${key}"`]);
  }
  lines.splice(start, end - start + 1, ...renderEntry(key, vals).split("\n"));
}

if (!changed.length) {
  console.log(`no changes — sheet matches i18n.ts (${sheet.size} keys checked)`);
  process.exit(0);
}

writeFileSync(I18N_PATH, lines.join("\n"), "utf8");
console.log(
  `i18n.ts updated: ${changed.length} of ${sheet.size} keys changed ` +
    `(hy ${perLocale.hy}, ru ${perLocale.ru}, en ${perLocale.en})`,
);
console.log("changed keys:\n  " + changed.join("\n  "));
console.log('\nnext: npx vitest run && npx tsc --noEmit, then commit & push to deploy.');
}

main();
