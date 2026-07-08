import "server-only";
import { prisma } from "@/lib/prisma";
import type { ProjectListDTO, ProjectDetailDTO } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { formatMoneyRange } from "@/lib/currency";
import { getRates } from "@/lib/currency/rates";
import type { CurrencyCode } from "@/lib/currency";

/** locale → en → base fallback chain for a per-locale content field. Returns
   the first non-empty candidate in that order. */
function pickLocale(locale: Locale, values: { hy?: string | null; ru?: string | null; en?: string | null }, base: string): string {
  const byLocale = locale === "hy" ? values.hy : locale === "ru" ? values.ru : values.en;
  if (byLocale) return byLocale;
  if (values.en) return values.en;
  return base;
}

// ── format token dictionary ──────────────────────────────────────────────
// `format` is a free-text string like "50 ep × 1m 15s" or "95 min · Feature ·
// 12+" built from a small closed set of English tokens plus numbers/units/
// ratings that stay as-is. Replace whole-word tokens only.
const FORMAT_TOKENS: Record<string, { ru: string; hy: string }> = {
  Feature: { ru: "Полнометражный", hy: "Ֆիլմ" },
  Series: { ru: "Сериал", hy: "Սերիալ" },
  Documentary: { ru: "Документальный", hy: "Վավերագրական" },
  Film: { ru: "Фильм", hy: "Ֆիլմ" },
  min: { ru: "мин", hy: "րոպե" },
  ep: { ru: "эп", hy: "դրվագ" },
};

function localizeFormat(locale: Locale, format: string): string {
  if (locale === "en" || !format) return format;
  return format
    .split(" · ")
    .map((part) =>
      part.replace(/[A-Za-z]+/g, (word) => {
        const entry = FORMAT_TOKENS[word];
        if (!entry) return word;
        return locale === "ru" ? entry.ru : entry.hy;
      }),
    )
    .join(" · ");
}

// ── country token dictionary ─────────────────────────────────────────────
const COUNTRY_TOKENS: Record<string, { ru: string; hy: string }> = {
  Armenia: { ru: "Армения", hy: "Հայաստան" },
  Russia: { ru: "Россия", hy: "Ռուսաստան" },
  Georgia: { ru: "Грузия", hy: "Վրաստան" },
  Italy: { ru: "Италия", hy: "Իտալիա" },
  France: { ru: "Франция", hy: "Ֆրանսիա" },
  US: { ru: "США", hy: "ԱՄՆ" },
  USA: { ru: "США", hy: "ԱՄՆ" },
  Diaspora: { ru: "Диаспора", hy: "Սփյուռք" },
};

function localizeCountries(locale: Locale, countries: string): string {
  if (locale === "en" || !countries) return countries;
  return countries
    .split(", ")
    .map((token) => {
      const entry = COUNTRY_TOKENS[token];
      if (!entry) return token;
      return locale === "ru" ? entry.ru : entry.hy;
    })
    .join(", ");
}

export async function getProjects(
  locale: Locale,
  currency: CurrencyCode,
  activeOnly = true,
): Promise<ProjectListDTO[]> {
  const rows = await prisma.project.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { sortOrder: "asc" },
    include: { opportunities: { select: { category: true } } },
  });
  const rates = await getRates();
  return rows.map((p) => ({
    id: p.id,
    code: p.code,
    title: pickLocale(locale, { hy: p.titleHy, ru: p.titleRu, en: p.titleEn }, p.title),
    genre: p.genre,
    synopsis: pickLocale(locale, { hy: p.synopsisHy, ru: p.synopsisRu, en: p.synopsisEn }, p.synopsis),
    poster: p.poster ?? "",
    format: localizeFormat(locale, p.format),
    studio: p.studio,
    countries: localizeCountries(locale, p.countries),
    audienceGender: p.audienceGender,
    audienceAge: p.audienceAge,
    projViews: p.projViews,
    budgetDisplay: formatMoneyRange(p.budgetMinAmd, p.budgetMaxAmd, currency, rates, locale),
    budgetMinAmd: p.budgetMinAmd,
    budgetMaxAmd: p.budgetMaxAmd,
    status: p.status,
    opportunitiesCount: p.opportunities.length,
    productCategories: Array.from(new Set(p.opportunities.map((o) => o.category))).sort(),
    slotsTotal: p.slotsTotal,
    slotsTaken: p.slotsTaken,
    applicationDeadline: p.applicationDeadline?.toISOString() ?? null,
    releaseDate: p.releaseDate?.toISOString() ?? null,
    platforms: p.platforms ?? "[]",
    placementType: p.placementType,
    priceNote: p.priceNote,
    priceDisplay:
      p.priceMinAmd != null && p.priceMaxAmd != null
        ? formatMoneyRange(p.priceMinAmd, p.priceMaxAmd, currency, rates, locale)
        : null,
  }));
}

export async function getProject(
  id: number,
  locale: Locale,
  currency: CurrencyCode,
  activeOnly = false,
): Promise<ProjectDetailDTO | null> {
  const p = await prisma.project.findFirst({
    where: activeOnly ? { id, isActive: true } : { id },
    include: {
      opportunities: { orderBy: { sortOrder: "asc" } },
      actors: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!p) return null;
  const rates = await getRates();
  const exposureTotal = p.opportunities.reduce((s, o) => s + o.estValue, 0);
  return {
    id: p.id,
    code: p.code,
    title: pickLocale(locale, { hy: p.titleHy, ru: p.titleRu, en: p.titleEn }, p.title),
    genre: p.genre,
    synopsis: pickLocale(locale, { hy: p.synopsisHy, ru: p.synopsisRu, en: p.synopsisEn }, p.synopsis),
    poster: p.poster ?? "",
    gallery: p.gallery ?? "[]",
    format: localizeFormat(locale, p.format),
    studio: p.studio,
    status: p.status,
    releaseLabel: p.releaseLabel,
    countries: localizeCountries(locale, p.countries),
    audienceGender: p.audienceGender,
    audienceAge: p.audienceAge,
    projViews: p.projViews,
    cpmDisplay: formatMoneyRange(p.cpmMinAmd, p.cpmMaxAmd, currency, rates, locale, { decimals: 2 }),
    budgetDisplay: formatMoneyRange(p.budgetMinAmd, p.budgetMaxAmd, currency, rates, locale),
    budgetMinAmd: p.budgetMinAmd,
    budgetMaxAmd: p.budgetMaxAmd,
    opportunities: p.opportunities.map((o) => ({
      sceneNo: o.sceneNo,
      description: o.description,
      mood: o.mood,
      rationale: o.rationale,
      type: o.type,
      prominence: o.prominence,
      category: o.category,
      estValue: o.estValue,
      durationSec: o.durationSec,
    })),
    exposureTotal,
    opportunitiesCount: p.opportunities.length,
    productCategories: Array.from(new Set(p.opportunities.map((o) => o.category))).sort(),
    slotsTotal: p.slotsTotal,
    slotsTaken: p.slotsTaken,
    applicationDeadline: p.applicationDeadline?.toISOString() ?? null,
    releaseDate: p.releaseDate?.toISOString() ?? null,
    platforms: p.platforms ?? "[]",
    placementType: p.placementType,
    priceNote: p.priceNote,
    priceDisplay:
      p.priceMinAmd != null && p.priceMaxAmd != null
        ? formatMoneyRange(p.priceMinAmd, p.priceMaxAmd, currency, rates, locale)
        : null,
    actors: p.actors.map((a) => ({ id: a.id, name: a.name, role: a.role })),
  };
}

export async function getProjectIds(): Promise<number[]> {
  // Used by generateStaticParams at build time. If the DB is unreachable during
  // the build (e.g. env not injected into the Hostinger build step), fall back
  // to an empty list — report pages are `dynamicParams`, so they still render
  // on demand at runtime. This keeps the build from failing on a DB hiccup.
  try {
    const rows = await prisma.project.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  } catch {
    return [];
  }
}
