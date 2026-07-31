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
