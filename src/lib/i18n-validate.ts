/* Validation rules for edited UI-dictionary values, shared by the in-admin
   translation editor (src/app/admin/(panel)/i18n/*) and the legacy
   Google-Sheet importer (scripts/i18n-import.ts).

   Covers the invariants src/lib/i18n.guard.test.ts asserts on the committed
   file, plus the ones only reachable through hand editing — checked *before*
   anything is written, so a bad value is a red row in the editor instead of a
   broken deploy:
     1. no empty cell in any of hy / ru / en,
     2. no Cyrillic homoglyph inside an Armenian value,
     3. {token} placeholders match the reference (English) string,
     4. no absurdly long value (paste accident, and TEXT has a byte ceiling),
     5. no invisible/control character — see FORBIDDEN below.

   Pure functions — no fs, no DB — so both the Next.js server runtime and the
   tsx scripts can import them. */

// Relative sibling imports (not the `@/` alias) so the tsx scripts under
// scripts/ can import this module without tsconfig-path resolution.
import { LOCALES, type Locale } from "./i18n";
import { CYRILLIC, placeholders } from "./i18n-csv";

/** The three values of one dictionary entry. */
export type Values = Record<Locale, string>;

/** One rule violation. `locale` is null for whole-entry problems. */
export type ValidationIssue = {
  key: string;
  locale: Locale | null;
  message: string;
};

/** Human-readable locale names used in issue messages. */
const LOCALE_NAME: Record<Locale, string> = {
  hy: "армянском",
  ru: "русском",
  en: "английском",
};

/** Longest value we accept. UI strings are labels and short paragraphs; the
 *  draft columns are MySQL TEXT (65 535 *bytes* — roughly 21 800 Armenian
 *  characters), and anything near this is a paste accident, not a translation. */
const MAX_LENGTH = 2000;

/* Code points that must never enter the dictionary.
   JSON.stringify escapes almost none of them, so they would survive into
   src/lib/i18n.ts, the CSV export and the rendered page as bytes nobody can
   see in review. U+2028/U+2029 are worse than invisible: some JS parsers treat
   them as line terminators inside a string literal.

   Expressed as code-point ranges rather than a regex on purpose — a regex
   would have to embed the very characters (or escapes) we are banning, which
   makes this file itself unreviewable. Tab and newline are allowed: a newline
   is legitimate in a multi-line label and renderEntry() escapes it. */
type Ranges = readonly (readonly [number, number])[];

const FORBIDDEN: { ranges: Ranges; label: string }[] = [
  {
    // C0 controls minus \t (0x09) and \n (0x0A), plus DEL.
    ranges: [
      [0x00, 0x08],
      [0x0b, 0x0c],
      [0x0e, 0x1f],
      [0x7f, 0x7f],
    ],
    label: "управляющий символ",
  },
  { ranges: [[0x2028, 0x2029]], label: "разделитель строк" },
  {
    // Zero-width + bidi overrides + word joiner + isolates + BOM.
    ranges: [
      [0x200b, 0x200f],
      [0x202a, 0x202e],
      [0x2060, 0x2060],
      [0x2066, 0x2069],
      [0xfeff, 0xfeff],
    ],
    label: "невидимый символ",
  },
];

/** First code point of `s` inside any of `ranges`, or null. */
function firstIn(s: string, ranges: Ranges): number | null {
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    for (const [from, to] of ranges) {
      if (cp >= from && cp <= to) return cp;
    }
  }
  return null;
}

/** `U+200B` style label for an error message. */
function codeLabel(cp: number): string {
  return `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
}

/**
 * Validate one entry. `reference` is the currently-committed entry — its
 * English value defines the expected placeholder set, so a translator can
 * never silently drop a `{count}` that the code interpolates.
 */
export function validateEntry(key: string, values: Values, reference: Values): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const loc of LOCALES) {
    const value = values[loc];

    if (value.trim() === "") {
      issues.push({ key, locale: loc, message: `Пусто в ${LOCALE_NAME[loc]}` });
      continue; // the checks below would just pile onto an empty cell
    }

    if (value.length > MAX_LENGTH) {
      issues.push({
        key,
        locale: loc,
        message: `Слишком длинный текст: ${value.length} символов, максимум ${MAX_LENGTH}`,
      });
    }

    for (const rule of FORBIDDEN) {
      const cp = firstIn(value, rule.ranges);
      if (cp !== null) {
        issues.push({
          key,
          locale: loc,
          message: `${rule.label} ${codeLabel(cp)} в тексте — удалите его (обычно приезжает с копипастом)`,
        });
      }
    }
  }

  const hit = values.hy.match(CYRILLIC);
  if (hit) {
    issues.push({
      key,
      locale: "hy",
      message: `Кириллическая буква «${hit[0]}» в армянском тексте (гомоглиф после копипаста)`,
    });
  }

  // The reference English string is the contract: `{name}` in the code must
  // survive into every translation, or the UI renders a literal brace.
  const expected = placeholders(reference.en);
  for (const loc of LOCALES) {
    const got = placeholders(values[loc]);
    if (got.join(",") !== expected.join(",")) {
      issues.push({
        key,
        locale: loc,
        message:
          `Плейсхолдеры не совпадают: {${got.join("}, {") || "—"}} ` +
          `вместо {${expected.join("}, {") || "—"}}`,
      });
    }
  }

  return issues;
}

/**
 * Validate a batch of edits against the committed dictionary. Entries whose
 * key is unknown are reported (and must not be written — the key set of the
 * dictionary is owned by the code, not by the translator).
 */
export function validateBatch(
  edits: Map<string, Values>,
  dictionary: Record<string, Values>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const [key, values] of edits) {
    const reference = dictionary[key];
    if (!reference) {
      issues.push({ key, locale: null, message: "Неизвестный ключ — его нет в словаре кода" });
      continue;
    }
    issues.push(...validateEntry(key, values, reference));
  }
  return issues;
}

/** True when `values` differs from the committed entry in at least one locale. */
export function isChanged(values: Values, reference: Values): boolean {
  return LOCALES.some((loc) => values[loc] !== reference[loc]);
}
