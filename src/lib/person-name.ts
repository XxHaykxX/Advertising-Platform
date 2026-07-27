/* Per-locale spelling of a cast/crew person's name (2026-07-27).
 *
 * A name is a proper noun, so what the three columns hold is transliteration,
 * not translation: Արամ Խաչատրյան / Арам Хачатрян / Aram Khachatryan. The
 * directory (/admin/cast) owns them; project `Actor` rows carry a snapshot.
 *
 * Pure — no I/O, no server-only import — so both the server data layer and the
 * client editors can use it, and it stays trivially unit-testable. */

import type { Locale } from "@/lib/i18n";

/** The three spellings as stored on Person/Actor. */
export type PersonNames = { nameHy: string; nameRu: string; nameEn: string };

/**
 * Pick the spelling for `locale`, falling back the same way the rest of the
 * app does (see pickLocale in src/lib/data/projects.ts): the asked-for locale,
 * then English (the closest thing to a neutral spelling for a Latin-alphabet
 * reader), then the legacy base `name` column.
 *
 * The base is last on purpose: a row filled in only in Armenian must still
 * render *something* on the Russian site rather than an empty card.
 */
export function pickPersonName(locale: Locale, names: Partial<PersonNames>, base: string): string {
  const byLocale = locale === "hy" ? names.nameHy : locale === "ru" ? names.nameRu : names.nameEn;
  return (byLocale || "").trim() || (names.nameEn || "").trim() || base;
}

/** Armenian (Mesropian) letter — the test that decides which column a legacy
 *  single-spelling name belongs in. Covers U+0530–U+058F, the same range the
 *  SQL backfill matches (docs/prod-migrations/2026-07-27-cast-crew-i18n.sql). */
const ARMENIAN = /[԰-֏]/;

/**
 * Which locale column a legacy `name` should be backfilled into: Armenian
 * script -> hy, anything else (the seed data is Latin) -> en. Deliberately
 * never guesses Russian — Cyrillic spellings were never entered, and a wrong
 * guess would show the same string twice instead of leaving the fallback to do
 * its job.
 *
 * Exported so the SQL backfill in docs/prod-migrations and this app agree on
 * the rule, and so it can be unit-tested.
 */
export function guessNameLocale(name: string): "hy" | "en" {
  return ARMENIAN.test(name) ? "hy" : "en";
}

/** Legacy row -> the three columns, used by the backfill and by the creator
 *  form (where a member types one spelling in their own language). */
export function seedNames(name: string, locale: Locale | "auto" = "auto"): PersonNames {
  const target = locale === "auto" ? guessNameLocale(name) : locale;
  const trimmed = name.trim();
  return {
    nameHy: target === "hy" ? trimmed : "",
    nameRu: target === "ru" ? trimmed : "",
    nameEn: target === "en" ? trimmed : "",
  };
}

/** Every spelling a row carries, for cross-language search: the base plus the
 *  three columns, blanks dropped. */
export function allSpellings(names: Partial<PersonNames>, base: string): string[] {
  return [base, names.nameHy, names.nameRu, names.nameEn]
    .map((s) => (s || "").trim())
    .filter(Boolean);
}
