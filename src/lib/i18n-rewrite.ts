/* Surgical rewriter for src/lib/i18n.ts.

   Given the dictionary file's source text and a set of new values, replaces
   ONLY the entries that changed and leaves every other byte alone — section
   comments, blank lines and the formatting of untouched entries survive, so
   the git diff of a translation publish stays reviewable.

   Used by both writers of the dictionary:
     - the in-admin editor (commits the result via the GitHub Contents API),
     - scripts/i18n-import.ts (writes it to disk).

   Values are emitted with JSON.stringify, which always yields a valid TS
   string literal — no way for a translator's quote/backslash/newline to break
   the build. Entry shape mirrors the file's existing style and keeps `ru:`
   first, because src/lib/i18n.guard.test.ts anchors its duplicate-key regex
   on `"key": { ru:`.

   Pure string work — no fs, no DB. */

import { LOCALES, type Locale } from "./i18n";

export type Values = Record<Locale, string>;

const ser = (s: string) => JSON.stringify(s);

/** Render one dictionary entry: single-line while it fits the file's ~120-col
 *  style, otherwise the multi-line form already used for long entries. */
export function renderEntry(key: string, v: Values): string {
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

/** Pull the three values back out of an entry's source text. Returns null when
 *  the text isn't a plain `ru:`/`en:`/`hy:` triple of JSON string literals (a
 *  hand-written variation we must not silently overwrite). */
function parseEntry(text: string): Values | null {
  const read = (loc: Locale): string | null => {
    const m = text.match(new RegExp(`\\b${loc}:\\s*("(?:[^"\\\\]|\\\\.)*")`));
    if (!m) return null;
    try {
      const v: unknown = JSON.parse(m[1]);
      return typeof v === "string" ? v : null;
    } catch {
      return null;
    }
  };
  const ru = read("ru");
  const en = read("en");
  const hy = read("hy");
  return ru === null || en === null || hy === null ? null : { ru, en, hy };
}

/** Thrown when the file being rewritten no longer holds the values the caller
 *  believes are committed — i.e. someone/something changed the dictionary in
 *  between. Callers turn this into "reload and try again". */
export class DictionaryDriftError extends Error {
  constructor(public readonly key: string, message: string) {
    super(message);
    this.name = "DictionaryDriftError";
  }
}

export type RewriteResult = {
  /** The full new file contents. */
  source: string;
  /** Keys that were actually replaced, in the order they were applied. */
  changed: string[];
  /** How many values changed per locale (for the commit message / UI). */
  perLocale: Record<Locale, number>;
};

/**
 * Replace `updates` inside the dictionary source.
 *
 * `current` is the dictionary as the source file has it (i.e. the `UI` object
 * imported from that same commit) — entries whose values already match are
 * skipped, so a no-op publish produces no diff.
 *
 * Throws when an entry cannot be located in the source, and a
 * `DictionaryDriftError` when it is found but holds values other than
 * `current` — both mean the file drifted from the dictionary the caller is
 * reasoning about, and writing anyway would corrupt it or revert someone
 * else's publish.
 */
export function rewriteDictionarySource(
  source: string,
  updates: Map<string, Values>,
  current: Record<string, Values>,
): RewriteResult {
  const lines = source.split("\n");
  const changed: string[] = [];
  const perLocale: Record<Locale, number> = { ru: 0, en: 0, hy: 0 };

  for (const [key, next] of updates) {
    const cur = current[key];
    if (!cur) throw new Error(`unknown dictionary key "${key}"`);
    if (LOCALES.every((loc) => cur[loc] === next[loc])) continue;

    changed.push(key);
    for (const loc of LOCALES) if (cur[loc] !== next[loc]) perLocale[loc]++;

    // Locate the entry: a line starting `  "key": {`; single-line entries end
    // with `},` on that same line, multi-line ones run until an exact `  },`.
    const startRe = new RegExp(`^  ${ser(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}: \\{`);
    const start = lines.findIndex((l) => startRe.test(l));
    if (start === -1) throw new Error(`entry for "${key}" not found in i18n.ts source`);
    let end = start;
    if (!/\},\s*$/.test(lines[start])) {
      while (end < lines.length - 1 && lines[end].trimEnd() !== "  },") end++;
      if (lines[end].trimEnd() !== "  },") throw new Error(`unterminated entry for "${key}"`);
    }

    // Drift guard. Finding the line isn't enough: if the file already holds
    // values other than `current` (a newer publish that this build hasn't
    // picked up yet, or a hand edit), overwriting would silently revert
    // someone else's work — and the validation that ran against `current`
    // was measured against the wrong reference anyway. Bail out instead.
    const inFile = parseEntry(lines.slice(start, end + 1).join("\n"));
    if (!inFile) {
      throw new DictionaryDriftError(key, `entry for "${key}" is not in the expected shape`);
    }
    if (LOCALES.some((loc) => inFile[loc] !== cur[loc])) {
      throw new DictionaryDriftError(
        key,
        `entry for "${key}" differs from the dictionary this build was compiled with`,
      );
    }

    lines.splice(start, end - start + 1, ...renderEntry(key, next).split("\n"));
  }

  return { source: lines.join("\n"), changed, perLocale };
}
