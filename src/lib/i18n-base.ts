/* Locale plumbing shared by server and client code — no dictionary data here
   (see i18n.ts for the ~2400-line UI dictionary, server-only, and
   i18n-client.tsx for the client-side dictionary slice + provider). Kept as
   its own module so client components can import locale helpers without
   pulling the full dictionary into the browser bundle. */

export const LOCALES = ["ru", "en", "hy"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "hy";
export const LOCALE_COOKIE = "locale";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** Locale tag for Intl/Date APIs (toLocaleDateString, etc). */
export function intlLocale(locale: Locale): string {
  return locale === "ru" ? "ru-RU" : locale === "hy" ? "hy-AM" : "en-US";
}

/** Punctuation between an inline label and its value ("Views: 12").
 *
 *  Armenian does not use a colon there — it uses a but (՝), and a Latin colon
 *  after an Armenian word reads as a typo to a reader of it. Every call site
 *  that glued a colon onto a translated label in JSX was hardcoding the
 *  Russian and English convention into all three languages. (Spelled out in
 *  prose rather than shown as a t(…) example: the client-key generator scans
 *  this module's dependents and collected the example as a real key.)
 *
 *  Only for labels whose key is reused elsewhere without a separator. When a
 *  label key has exactly one call site, put the punctuation in the dictionary
 *  value instead (card.release, card.availableOn, legal.updated do) — that
 *  leaves it where the translator can change it without a code change. */
export function labelSep(locale: Locale): string {
  return locale === "hy" ? "՝" : ":";
}
