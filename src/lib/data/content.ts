import "server-only";
import { prisma } from "@/lib/prisma";
import { CONTENT_DEFAULTS_BY_LOCALE } from "@/lib/content-keys";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

/** Full text map: per-locale registry defaults overridden by DB rows.
   Falls back to RU when a localized DB value is empty. */
export async function getContent(
  locale: Locale = DEFAULT_LOCALE,
): Promise<Record<string, string>> {
  const rows = await prisma.content.findMany();
  const map: Record<string, string> = { ...CONTENT_DEFAULTS_BY_LOCALE[locale] };
  for (const r of rows) {
    // Only a non-empty localized DB value overrides the baked default — an
    // empty EN/HY field keeps the built-in translation (not the RU fallback).
    const localized = (r[locale] || "").trim();
    if (localized) map[r.key] = localized;
  }
  return map;
}

/** Raw per-language rows keyed by content key (for the admin editor). */
export async function getContentRows(): Promise<
  Record<string, { ru: string; en: string; hy: string }>
> {
  const rows = await prisma.content.findMany();
  const out: Record<string, { ru: string; en: string; hy: string }> = {};
  for (const r of rows) out[r.key] = { ru: r.ru, en: r.en, hy: r.hy };
  return out;
}
