import type { Locale } from "@/lib/i18n";

/** JSON string[] (or null) -> string[]; tolerant of malformed data. Lives here
   rather than in projects.ts so this module stays a leaf — projects.ts imports
   it, and the other direction would be a cycle. */
export function parseJsonList(json: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/* The locale → en → base fallback chain for a per-locale CONTENT field (a
   project title, a placement name, a package's benefits) — as opposed to UI
   copy, which comes from the dictionary in src/lib/i18n.ts.

   `base` is the legacy single-language column every one of these fields still
   carries: rows written before that field grew its language tabs have only
   that one filled, and a locale an editor never opened is an empty string, not
   a missing row. Falling through to English before the base keeps a project
   that was translated to en but not ru readable to a Russian visitor.

   Lives in its own module because four readers need it now (projects,
   interests, brand-interests, and the mail templates) and the copies had
   already started to drift. */

export function pickLocale(
  locale: Locale,
  values: { hy?: string | null; ru?: string | null; en?: string | null },
  base: string,
): string {
  const byLocale = locale === "hy" ? values.hy : locale === "ru" ? values.ru : values.en;
  if (byLocale) return byLocale;
  if (values.en) return values.en;
  return base;
}

/** Same chain for the bullet lists stored as a JSON string[] (placement
   descriptions, package benefits — IA-44, 2026-08-05).

   It cannot just call pickLocale: an empty list serializes to the string "[]",
   which is perfectly truthy, so a locale the editor opened and left empty would
   win the chain and render as no bullets at all while a filled fallback sat
   right next to it. Parsing first and testing the array length is the only way
   to tell "no bullets here" from "no value here". */
export function pickLocaleList(
  locale: Locale,
  values: { hy?: string | null; ru?: string | null; en?: string | null },
  base: string,
): string[] {
  const byLocale = locale === "hy" ? values.hy : locale === "ru" ? values.ru : values.en;
  for (const candidate of [byLocale, values.en, base]) {
    const list = parseJsonList(candidate ?? "");
    if (list.length) return list;
  }
  return [];
}

/** The three per-locale columns a placement/package carries, plus its legacy
   fallback — the exact shape both readers below need selected from Prisma. */
export const OFFER_NAME_SELECT = {
  tier: { name: true, nameHy: true, nameRu: true, nameEn: true },
  placement: { title: true, titleHy: true, titleRu: true, titleEn: true },
} as const;

export function pickTierName(
  locale: Locale,
  tier: { name: string; nameHy: string; nameRu: string; nameEn: string } | null | undefined,
): string {
  if (!tier) return "";
  return pickLocale(locale, { hy: tier.nameHy, ru: tier.nameRu, en: tier.nameEn }, tier.name);
}

export function pickPlacementTitle(
  locale: Locale,
  placement: { title: string; titleHy: string; titleRu: string; titleEn: string } | null | undefined,
): string {
  if (!placement) return "";
  return pickLocale(
    locale,
    { hy: placement.titleHy, ru: placement.titleRu, en: placement.titleEn },
    placement.title,
  );
}
