// Scans every module that actually ships to the browser for i18n dictionary
// keys it uses, and writes src/lib/i18n-client-keys.ts — the allow-list
// clientDict() (src/lib/i18n.ts) uses to build the small per-locale slice
// that ships to the browser, instead of the whole ~2400-line UI dictionary
// (bundle audit 2026-07-31, task #18).
//
// "Ships to the browser" isn't just "use client" files: a client component
// can import a plain (no-directive) helper — e.g. notifications.ts's
// renderNotification(t, ...), called from notification-toaster.tsx — whose
// own t("...") calls also end up bundled. So this walks the real import
// graph from every "use client" file (BFS over `import ... from "..."`
// edges, @/ and relative specifiers only) and scans everything reachable.
// Traversal stops at a "use server" boundary (Next replaces it with an RPC
// stub client-side — the function body, and anything only it imports, never
// reaches the browser) and never re-visits a file.
//
// Two kinds of keys are collected:
//   - static:  literal keys passed to t("some.key") (including
//     `t(cond ? "a.one" : "a.many")` ternaries) — found by scanning source
//     text, no need to list them here.
//   - prefix:  dynamic keys built at runtime, e.g. t(`completeness.item.${k}`)
//     or localizeValue(locale, "genre", project.genre). localizeValue's
//     prefix argument is always a literal, so those are auto-detected; the
//     handful of t(`prefix.${var}`) template-literal call sites can't be
//     statically resolved to a literal, so their prefixes are hand-listed
//     below (EXTRA_PREFIXES) — update that list if a new one shows up.
//
// Usage:
//   node scripts/gen-i18n-client-keys.mjs           (writes the file)
//   node scripts/gen-i18n-client-keys.mjs --check    (no write; exits 1 if
//                                                      the checked-in file is
//                                                      stale, i.e. a client
//                                                      file uses a key that
//                                                      isn't covered yet)

import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(new URL(".", import.meta.url)));
const SRC = path.join(ROOT, "src");
const OUT_FILE = path.join(SRC, "lib", "i18n-client-keys.ts");
const CHECK = process.argv.includes("--check");

// t(`prefix.${...}`) template-literal call sites whose prefix can't be
// statically extracted (the localizeValue(locale, "prefix", value) form
// below IS auto-detected — this list is only for the t() form):
//   - translate.${errorCode} — AI-translate error banner (project-form.tsx,
//     portfolio-form.tsx)
//   - faq.q${n}.question / faq.q${n}.answer — FAQ accordion (faq.tsx)
//   - attr.${key} / attrValue.${key}.${value} — ad-channel attribute filters
//     and form fields, built via attrLabelKey()/attrValueLabelKey()
//     (ad-channel-attrs.ts) rather than a t(`...`) template literal, so the
//     scan above never sees the prefix at the call site.
const EXTRA_PREFIXES = ["translate.", "faq.", "attr.", "attrValue."];

async function walk(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, out);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function directive(src) {
  const firstLine = src.split(/\r?\n/, 1)[0]?.trim();
  if (firstLine === '"use client";' || firstLine === "'use client';" || firstLine === '"use client"' || firstLine === "'use client'") {
    return "client";
  }
  if (firstLine === '"use server";' || firstLine === "'use server';" || firstLine === '"use server"' || firstLine === "'use server'") {
    return "server-action";
  }
  return null;
}

/** Resolve an `import ... from "spec"` specifier to a file under src/, or
 *  null for anything outside our own source (node_modules, "next/...",
 *  "react", etc.) — we only care about our own module graph. */
function resolveImport(fromFile, spec) {
  if (!spec.startsWith(".") && !spec.startsWith("@/")) return null;
  const base = spec.startsWith("@/")
    ? path.join(SRC, spec.slice(2))
    : path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.mjs`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

function importSpecifiers(src) {
  return [...src.matchAll(/\bfrom\s+["']([^"']+)["']/g)].map((m) => m[1]);
}

/** Everything inside a balanced `(...)` span starting right after the open
 *  paren at `openIdx`, so ternary/multi-arg calls (e.g.
 *  `t(n === 1 ? "a.one" : "a.many")`) are scanned in full, not just a literal
 *  starting immediately at the call site. */
function balancedSpan(src, openIdx) {
  let depth = 1;
  let i = openIdx;
  while (i < src.length && depth > 0) {
    if (src[i] === "(") depth++;
    else if (src[i] === ")") depth--;
    i++;
  }
  return src.slice(openIdx, i - 1);
}

function scan(src, keys, prefixes) {
  // The translator is `makeUI()` on the server (i18n.ts, a plain function) and
  // `useUI()` in client components (i18n-client.tsx, which reads context and is
  // therefore a real hook) — match both. Its result isn't always named `t`
  // either: reorder-list.tsx pins a second, English-only translator as
  // `const tEn = makeUI("en")` for admin chrome. Collect every local alias
  // (always including the "t" convention) instead of hardcoding names, so a
  // future alias doesn't silently go unscanned.
  const translatorNames = new Set(["t"]);
  for (const m of src.matchAll(/\b(?:const|let)\s+(\w+)\s*=\s*(?:makeUI|useUI)\(/g)) {
    translatorNames.add(m[1]);
  }

  // t("some.key") / t('some.key') / t(`some.key`) / t(cond ? "a" : "b") —
  // scan the whole call span for every dict-key-shaped literal in it.
  for (const name of translatorNames) {
    const callRe = new RegExp(`\\b${name}\\(`, "g");
    for (const m of src.matchAll(callRe)) {
      const span = balancedSpan(src, m.index + m[0].length);
      for (const lit of span.matchAll(/["'`]([A-Za-z][\w]*(?:\.[\w]+)+)["'`]/g)) {
        keys.add(lit[1]);
      }
      // t(`prefix.${expr}`) — the key is built at runtime, so take the static
      // head as a prefix group. Trimming at the last dot covers both
      // `completeness.item.${k}` (head already ends in a dot) and
      // `faq.q${n}.question` (head "faq.q" → group "faq."). This used to be a
      // hand-maintained list, which is exactly how the completeness checklist
      // shipped to prod rendering raw `completeness.item.*` keys on 2026-07-31:
      // nobody remembered to add its prefix. Derive it instead of listing it.
      for (const tpl of span.matchAll(/`([A-Za-z][\w.]*)\$\{/g)) {
        const dot = tpl[1].lastIndexOf(".");
        if (dot > 0) prefixes.add(tpl[1].slice(0, dot + 1));
      }
    }
  }
  // localizeValue(locale, "prefix", value) — the prefix arg is always a
  // literal string; turn it into a "prefix." group.
  for (const m of src.matchAll(/localizeValue\(\s*[\w.]+,\s*["'`]([\w.]+)["'`]/g)) {
    prefixes.add(`${m[1]}.`);
  }
  // useLocalizer(locale)'s returned callback (conventionally named
  // `localize`, but collect every alias like the useUI() ones above) drops
  // the locale arg: localize("prefix", value). Required whenever a component
  // maps localizeValue() over a variable-length array — calling the
  // context-reading localizeValue() itself once per item would violate the
  // Rules of Hooks (see i18n-client.tsx's useLocalizer docs).
  const localizerNames = new Set(["localize"]);
  for (const m of src.matchAll(/\b(?:const|let)\s+(\w+)\s*=\s*useLocalizer\(/g)) {
    localizerNames.add(m[1]);
  }
  for (const name of localizerNames) {
    const callRe = new RegExp(`\\b${name}\\(\\s*["'\`]([\\w.]+)["'\`]`, "g");
    for (const m of src.matchAll(callRe)) {
      prefixes.add(`${m[1]}.`);
    }
  }
}

async function collect() {
  const files = await walk(SRC);
  const bySrc = new Map();
  await Promise.all(
    files.map(async (f) => {
      bySrc.set(f, await readFile(f, "utf8"));
    }),
  );

  const keys = new Set();
  const prefixes = new Set(EXTRA_PREFIXES);
  const visited = new Set();
  const queue = files.filter((f) => directive(bySrc.get(f)) === "client");

  while (queue.length > 0) {
    const file = queue.pop();
    if (visited.has(file)) continue;
    visited.add(file);

    const src = bySrc.get(file);
    if (src === undefined) continue; // resolved outside src/ walk() covers (shouldn't happen)

    // "use server" is an RPC boundary: Next replaces the whole module with an
    // action-id stub in the client bundle, so neither its own t() calls nor
    // anything it imports ever reaches the browser — don't scan, don't descend.
    if (directive(src) === "server-action") continue;

    scan(src, keys, prefixes);

    for (const spec of importSpecifiers(src)) {
      const resolved = resolveImport(file, spec);
      if (resolved && !visited.has(resolved)) queue.push(resolved);
    }
  }

  return { keys: [...keys].sort(), prefixes: [...prefixes].sort() };
}

function renderFile({ keys, prefixes }) {
  const keysLiteral = keys.map((k) => `  ${JSON.stringify(k)},`).join("\n");
  const prefixesLiteral = prefixes.map((p) => `  ${JSON.stringify(p)},`).join("\n");
  return `// GENERATED FILE — do not edit by hand.
// Run \`npm run i18n:keys\` (scripts/gen-i18n-client-keys.mjs) to regenerate
// after adding/removing a t("...")/localizeValue(...) call reachable from a
// "use client" file. Checked \`--check\` in the test suite (see
// i18n-client-keys.test.ts).

/** Every literal key a client-bundled module passes to t(). */
export const CLIENT_KEYS: readonly string[] = [
${keysLiteral}
];

/** Dictionary key prefixes (with trailing ".") a client-bundled module
 *  builds at runtime — every UI[] key starting with one of these ships to
 *  the browser, regardless of which suffixes exist today (new
 *  genres/categories/etc. added later are covered automatically). */
export const CLIENT_PREFIXES: readonly string[] = [
${prefixesLiteral}
];
`;
}

async function main() {
  const collected = await collect();
  const rendered = renderFile(collected);

  if (CHECK) {
    let current = "";
    try {
      current = await readFile(OUT_FILE, "utf8");
    } catch {
      // missing file — treated as stale below
    }
    if (current !== rendered) {
      console.error(
        `i18n-client-keys.ts is stale (${collected.keys.length} keys, ${collected.prefixes.length} prefixes expected).\n` +
          "Run `npm run i18n:keys` and commit the result.",
      );
      process.exit(1);
    }
    console.log(`i18n-client-keys.ts is up to date (${collected.keys.length} keys, ${collected.prefixes.length} prefixes).`);
    return;
  }

  await writeFile(OUT_FILE, rendered, "utf8");
  console.log(`Wrote ${OUT_FILE} — ${collected.keys.length} keys, ${collected.prefixes.length} prefixes.`);
}

main();
