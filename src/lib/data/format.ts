/* Server-side formatting helpers for DB → display values. */

import type { Locale } from "@/lib/i18n";

const INTL: Record<Locale, string> = { ru: "ru-RU", en: "en-GB", hy: "hy-AM" };
const DEADLINE_PREFIX: Record<Locale, string> = {
  ru: "Заявки до",
  en: "Applications until",
  hy: "Հայտեր մինչ",
};

function stripYear(s: string) {
  return s.replace(/\s*(г\.?|թ\.?)$/u, "").trim();
}

/** Date → localized "Апрель 2026" / "April 2026". Empty string if null. */
export function formatReleaseLabel(d: Date | null, locale: Locale = "ru"): string {
  if (!d) return "";
  const s = stripYear(
    new Intl.DateTimeFormat(INTL[locale], { month: "long", year: "numeric" }).format(d),
  );
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Date → localized day-month-year, no prefix (e.g. "25 июня 2026" / "25 June 2026"). */
export function formatDateOnly(d: Date | null, locale: Locale = "ru"): string {
  if (!d) return "";
  return stripYear(
    new Intl.DateTimeFormat(INTL[locale], {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d),
  );
}

/** Date → "Заявки до 25 июня 2026" / "Applications until 25 June 2026". */
export function formatDeadlineLabel(d: Date | null, locale: Locale = "ru"): string {
  if (!d) return "";
  return `${DEADLINE_PREFIX[locale]} ${formatDateOnly(d, locale)}`;
}

/** Safe parse of a JSON-array string column → string[]. */
export function parseStringArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a.map(String) : [];
  } catch {
    return [];
  }
}

/** Date → "10.06.2026, 18:30". */
export function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Extract a YouTube video id from a watch/share/embed URL. */
export function youTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}
