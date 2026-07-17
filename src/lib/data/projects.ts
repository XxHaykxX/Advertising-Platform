import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ProjectListDTO, ProjectDetailDTO } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { formatMoney, formatMoneyRange } from "@/lib/currency";
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

/** #19: a SERIAL with episode data displays "{episodeMinutes}m/{episodes}
   episodes" (e.g. "60m/24episodes") instead of the free-text `format` column
   — computed once here so every consumer of ProjectListDTO/ProjectDetailDTO
   (project-card, report-hero, catalog) gets it for free without duplicating
   the branch. FILM (or a SERIAL missing episode data) falls back to the
   plain localized `format` string as before. */
function effectiveFormat(
  locale: Locale,
  p: { format: string; kind: string; episodes: number | null; episodeMinutes: number | null },
): string {
  if (p.kind === "SERIAL" && p.episodes && p.episodeMinutes) {
    return `${p.episodeMinutes}m/${p.episodes}episodes`;
  }
  return localizeFormat(locale, p.format);
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

/** "Bohemian Rhapsody, Ray, Michael" -> ["Bohemian Rhapsody", "Ray", "Michael"].
   Used for the comma-list press-kit fields (references, cinemas). */
function splitCommaList(s: string | null): string[] {
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

/** JSON string[] (or null) -> string[]; tolerant of malformed data. */
function parseJsonList(json: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

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

// Cache DB-backed reads. On the shared host every uncached request opens a
// Prisma connection + spins engine threads; caching keeps the DB pool (capped
// at 2) idle between revalidations and makes pages fast, which is what keeps us
// under the CloudLinux process limit under load. Output DTOs are already
// JSON-safe (dates are ISO strings, everything else scalar), so the whole
// mapped result caches cleanly. Cache key = keyParts + the (locale, currency,
// activeOnly) args. Tagged `projects` so admin mutations can invalidate on
// demand via revalidateTag("projects") instead of waiting out the window.
const REVALIDATE_SECONDS = 300;

const getProjectsCached = unstable_cache(
  async (
    locale: Locale,
    currency: CurrencyCode,
    activeOnly: boolean,
  ): Promise<ProjectListDTO[]> => {
    // #13: the public catalog (activeOnly=true) only ever shows projects that
    // have cleared moderation — PENDING/REJECTED/DRAFT stay hidden until an
    // admin/moderator approves them. Existing rows default to APPROVED, so
    // nothing already live disappears. Admin call sites pass activeOnly=false
    // and see every status (unfiltered by moderation).
    const rows = await prisma.project.findMany({
    where: activeOnly ? { isActive: true, moderationStatus: "APPROVED" } : undefined,
    orderBy: { sortOrder: "asc" },
  });
  const rates = await getRates();
  return rows.map((p) => ({
    id: p.id,
    code: p.code,
    title: pickLocale(locale, { hy: p.titleHy, ru: p.titleRu, en: p.titleEn }, p.title),
    genre: p.genre,
    synopsis: pickLocale(locale, { hy: p.synopsisHy, ru: p.synopsisRu, en: p.synopsisEn }, p.synopsis),
    poster: p.poster ?? "",
    format: effectiveFormat(locale, p),
    formatCategory: p.formatCategory,
    language: p.language,
    studio: p.studio,
    countries: localizeCountries(locale, p.countries),
    audienceGender: p.audienceGender,
    audienceAge: p.audienceAge,
    ageRating: p.ageRating,
    projViews: p.projViews,
    budgetDisplay: formatMoneyRange(p.budgetMinAmd, p.budgetMaxAmd, currency, rates, locale),
    budgetMinAmd: p.budgetMinAmd,
    budgetMaxAmd: p.budgetMaxAmd,
    status: p.status,
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
  },
  ["projects-list"],
  { revalidate: REVALIDATE_SECONDS, tags: ["projects"] },
);

export async function getProjects(
  locale: Locale,
  currency: CurrencyCode,
  activeOnly = true,
): Promise<ProjectListDTO[]> {
  return getProjectsCached(locale, currency, activeOnly);
}

const getProjectCached = unstable_cache(
  async (
    id: number,
    locale: Locale,
    currency: CurrencyCode,
    activeOnly: boolean,
  ): Promise<ProjectDetailDTO | null> => {
  const p = await prisma.project.findFirst({
    where: activeOnly ? { id, isActive: true, moderationStatus: "APPROVED" } : { id },
    include: {
      actors: { orderBy: { sortOrder: "asc" } },
      tiers: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!p) return null;
  const rates = await getRates();
  return {
    id: p.id,
    code: p.code,
    title: pickLocale(locale, { hy: p.titleHy, ru: p.titleRu, en: p.titleEn }, p.title),
    genre: p.genre,
    synopsis: pickLocale(locale, { hy: p.synopsisHy, ru: p.synopsisRu, en: p.synopsisEn }, p.synopsis),
    poster: p.poster ?? "",
    gallery: p.gallery ?? "[]",
    format: effectiveFormat(locale, p),
    formatCategory: p.formatCategory,
    language: p.language,
    studio: p.studio,
    status: p.status,
    releaseLabel: p.releaseLabel,
    countries: localizeCountries(locale, p.countries),
    audienceGender: p.audienceGender,
    audienceAge: p.audienceAge,
    ageRating: p.ageRating,
    projViews: p.projViews,
    cpmDisplay: formatMoneyRange(p.cpmMinAmd, p.cpmMaxAmd, currency, rates, locale, { decimals: 2 }),
    budgetDisplay: formatMoneyRange(p.budgetMinAmd, p.budgetMaxAmd, currency, rates, locale),
    budgetMinAmd: p.budgetMinAmd,
    budgetMaxAmd: p.budgetMaxAmd,
    applicationDeadline: p.applicationDeadline?.toISOString() ?? null,
    releaseDate: p.releaseDate?.toISOString() ?? null,
    platforms: p.platforms ?? "[]",
    placementType: p.placementType,
    priceNote: p.priceNote,
    priceDisplay:
      p.priceMinAmd != null && p.priceMaxAmd != null
        ? formatMoneyRange(p.priceMinAmd, p.priceMaxAmd, currency, rates, locale)
        : null,
    actors: p.actors.map((a) => ({ id: a.id, name: a.name, role: a.role, kind: a.kind, photo: a.photo ?? "" })),
    tagline: p.tagline ?? "",
    subgenre: p.subgenre ?? "",
    references: splitCommaList(p.references),
    cinemas: splitCommaList(p.cinemas),
    tiers: p.tiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      priceDisplay: formatMoney(tier.priceAmd, currency, rates, locale),
      benefits: parseJsonList(tier.benefits),
    })),
  };
  },
  ["project-detail"],
  { revalidate: REVALIDATE_SECONDS, tags: ["projects"] },
);

export async function getProject(
  id: number,
  locale: Locale,
  currency: CurrencyCode,
  activeOnly = false,
): Promise<ProjectDetailDTO | null> {
  return getProjectCached(id, locale, currency, activeOnly);
}

export async function getProjectIds(): Promise<number[]> {
  // Used by generateStaticParams at build time. If the DB is unreachable during
  // the build (e.g. env not injected into the Hostinger build step), fall back
  // to an empty list — report pages are `dynamicParams`, so they still render
  // on demand at runtime. This keeps the build from failing on a DB hiccup.
  try {
    const rows = await prisma.project.findMany({
      where: { isActive: true, moderationStatus: "APPROVED" },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  } catch {
    return [];
  }
}
