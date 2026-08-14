import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ProjectListDTO, ProjectDetailDTO } from "@/lib/types";
import { makeUI, type Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/currency";
import { localizeCountryList } from "@/lib/countries";
import { pickPersonName } from "@/lib/person-name";
import { getRates } from "@/lib/currency/rates";
import { isArchived, formatDuration, formatPriceFrom } from "@/lib/data/format";
import type { CurrencyCode } from "@/lib/currency";
import {
  PLACEMENT_TYPE_VALUES,
  deriveFormatCategory,
  parseRolesInput,
  parseReferencesInput,
  parseGenresInput,
} from "@/app/admin/(panel)/projects/form-shared";
import { parseJsonList, pickLocale, pickLocaleList } from "@/lib/data/pick-locale";
import { parseAttrs } from "@/lib/ad-channel-attrs";


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
  p: {
    format: string;
    kind: string;
    episodes: number | null;
    episodeMinutes: number | null;
    durationMinutes?: number | null;
  },
): string {
  const t = makeUI(locale);
  if (p.kind === "SERIAL" && p.episodes && p.episodeMinutes) {
    // Was a hardcoded English "11m/12episodes" — no space, no translation —
    // printed verbatim on the Armenian and Russian pages (audit A4).
    // Per-episode runtime as clock time (IA-50 §7) — see formatDuration.
    return t("format.serialEpisodesDuration", {
      n: p.episodes,
      duration: formatDuration(p.episodeMinutes, locale),
    });
  }
  // Single with a runtime: same treatment as the SERIAL branch. The admin form
  // has no free-text `format` field any more (2026-07-26), so Duration is the
  // only thing a new Single carries — without this its chip would be blank.
  // IA-50 §7: hours+minutes ("1 ժամ 43 րոպե") instead of raw minutes.
  if (p.kind === "FILM" && p.durationMinutes) {
    return formatDuration(p.durationMinutes, locale);
  }
  return localizeFormat(locale, p.format);
}

/** "Bohemian Rhapsody, Ray, Michael" -> ["Bohemian Rhapsody", "Ray", "Michael"].
   Used for the comma-list press-kit fields (cinemas). NOT for `references` —
   that column holds [{name,url}] JSON since the Reference Projects editor
   landed, and splitting it on commas printed JSON fragments as chips and lost
   every link (audit 1.1). It goes through parseReferencesInput instead, which
   is the same parser the editor prefills from and still understands the legacy
   comma-separated rows. */
function splitCommaList(s: string | null): string[] {
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}


function localizeCountries(locale: Locale, countries: string): string {
  // The list and its labels live in src/lib/countries.ts — the same source the
  // project form's picker uses, so a country can't be spelled one way in the
  // form and another in the catalog.
  return localizeCountryList(locale, countries);
}

/** The cheapest priced offer across a project's placements and packages,
 *  formatted for the visitor (2026-08-05). Unpriced rows are dropped BEFORE
 *  the minimum is taken, not coerced to zero — the same mistake that once made
 *  a project with one unpriced package look free and sort first in the
 *  favourites comparison and the "recommended" block. "" when nothing here
 *  carries a price; the card then says "on request" instead. */
/** The distinct integration kinds a project's placements carry (2026-08-10),
   kept in PLACEMENT_TYPE_VALUES order rather than the rows' own order: the
   card's chip row and the catalog facet both want one stable, editorial
   sequence, so two projects offering the same two kinds never list them
   differently. Unclassified rows (placementType null) drop out. */
function distinctPlacementTypes(placements: { placementType: string | null }[]): string[] {
  const present = new Set(placements.map((p) => p.placementType));
  return PLACEMENT_TYPE_VALUES.filter((v) => present.has(v));
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
    include: {
      // priceAmd rides along (2026-08-05) so the card can name the cheapest
      // thing on sale. Both tables are already joined here, so this is one
      // more column, not one more query.
      tiers: { select: { availableSlots: true, totalSlots: true, priceAmd: true } },
      // placementType rides along (2026-08-10) for the card's subtype chips and
      // the catalog's subtype facet — same "the join is already here" reasoning
      // as priceAmd above.
      placements: { select: { priceAmd: true, placementType: true } },
    },
  });
  const rates = await getRates();
  return rows.map((p) => ({
    id: p.id,
    code: p.code,
    title: pickLocale(locale, { hy: p.titleHy, ru: p.titleRu, en: p.titleEn }, p.title),
    genre: p.genre,
    genres: parseGenresInput(p.genres, p.genre),
    synopsis: pickLocale(locale, { hy: p.synopsisHy, ru: p.synopsisRu, en: p.synopsisEn }, p.synopsis),
    poster: p.poster ?? "",
    format: effectiveFormat(locale, p),
    formatCategory: deriveFormatCategory(p.formatCategory, p.kind, `${p.format} ${p.genre}`),
    studio: p.studio,
    countries: localizeCountries(locale, p.countries),
    ageRating: p.ageRating,
    applicationDeadline: p.applicationDeadline?.toISOString() ?? null,
    applicationDeadlineOngoing: p.applicationDeadlineOngoing,
    releaseDate: p.releaseDate?.toISOString() ?? null,
    releasePrecision: p.releasePrecision,
    platforms: p.platforms ?? "[]",
    slotsAvailable: p.tiers.reduce((sum, tier) => sum + (tier.availableSlots ?? 0), 0),
    slotsTotal: p.tiers.reduce((sum, tier) => sum + (tier.totalSlots ?? 0), 0),
    placementsCount: p.placements.length,
    placementTypes: distinctPlacementTypes(p.placements),
    tiersCount: p.tiers.length,
    priceFromDisplay: formatPriceFrom(
      [...p.placements, ...p.tiers].map((o) => o.priceAmd),
      currency,
      rates,
      locale,
    ),
    placementsPriceFromDisplay: formatPriceFrom(
      p.placements.map((o) => o.priceAmd),
      currency,
      rates,
      locale,
    ),
    tiersPriceFromDisplay: formatPriceFrom(
      p.tiers.map((o) => o.priceAmd),
      currency,
      rates,
      locale,
    ),
    attrs: parseAttrs(p.attrs),
    eventCity: p.eventCity,
    eventDate: p.eventDate?.toISOString() ?? null,
    eventCategory: p.eventCategory,
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
  const rows = await getProjectsCached(locale, currency, activeOnly);
  // Archive (2026-07-27): a project whose placement deadline has passed drops
  // out of every public listing — catalog, home page, the brand cabinet's
  // browse. Its report page stays reachable by direct link (see reports/[id]).
  //
  // Filtered HERE, outside getProjectsCached, on purpose: "is the deadline
  // behind us?" is a function of the current time, and baking it into a cached
  // row would freeze the answer for the cache lifetime — a project would linger
  // in the catalog for up to REVALIDATE_SECONDS after expiring.
  //
  // Only for the public view: admin call sites pass activeOnly=false and must
  // keep seeing everything, archived included.
  if (!activeOnly) return rows;
  return rows.filter((p) => !isArchived(p.applicationDeadline, p.applicationDeadlineOngoing));
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
      placements: { orderBy: { sortOrder: "asc" } },
      milestones: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!p) return null;
  const rates = await getRates();
  return {
    id: p.id,
    code: p.code,
    title: pickLocale(locale, { hy: p.titleHy, ru: p.titleRu, en: p.titleEn }, p.title),
    genre: p.genre,
    genres: parseGenresInput(p.genres, p.genre),
    synopsis: pickLocale(locale, { hy: p.synopsisHy, ru: p.synopsisRu, en: p.synopsisEn }, p.synopsis),
    poster: p.poster ?? "",
    gallery: p.gallery ?? "[]",
    presentationPdf: p.presentationPdf ?? "",
    format: effectiveFormat(locale, p),
    formatCategory: deriveFormatCategory(p.formatCategory, p.kind, `${p.format} ${p.genre}`),
    studio: p.studio,
    countries: localizeCountries(locale, p.countries),
    ageRating: p.ageRating,
    applicationDeadline: p.applicationDeadline?.toISOString() ?? null,
    applicationDeadlineOngoing: p.applicationDeadlineOngoing,
    releaseDate: p.releaseDate?.toISOString() ?? null,
    releasePrecision: p.releasePrecision,
    platforms: p.platforms ?? "[]",
    actors: p.actors.map((a) => ({
      id: a.id,
      // Names are transliterated per locale (Արամ / Арам / Aram), snapshotted
      // from the Person directory — see src/lib/person-name.ts.
      name: pickPersonName(locale, a, a.name),
      role: a.role,
      roles: parseRolesInput(a.roles, a.role),
      kind: a.kind,
      photo: a.photo ?? "",
    })),
    tagline: pickLocale(locale, { hy: p.taglineHy, ru: p.taglineRu, en: p.taglineEn }, p.tagline ?? ""),
    references: parseReferencesInput(p.references ?? "")
      // A row counts as filled in if it has a title OR an uploaded still/clip —
      // a picture with no caption is still worth showing.
      .filter((r) => r.name || r.media)
      .map((r) => ({ name: r.name, url: r.url, media: r.media ?? "" })),
    cinemas: splitCommaList(p.cinemas),
    productionBudgetDisplay:
      p.productionBudgetAmd != null ? formatMoney(p.productionBudgetAmd, currency, rates, locale) : "",
    tiers: p.tiers.map((tier) => ({
      id: tier.id,
      // Per-locale since IA-44 (2026-08-05); `name`/`benefits` are the fallback
      // for rows written before the editor grew its language tabs.
      name: pickLocale(locale, { hy: tier.nameHy, ru: tier.nameRu, en: tier.nameEn }, tier.name),
      // Raw AMD alongside the formatted strings: the sticky offer bar has to
      // compare packages and placements to name the cheapest one, and it
      // cannot do that on "2 500 000 ֏".
      priceAmd: tier.priceAmd,
      priceDisplay: tier.priceAmd != null ? formatMoney(tier.priceAmd, currency, rates, locale) : null,
      // The deal currency, for the application popup — see TierDTO.priceNative.
      priceNative: tier.priceAmd != null ? formatMoney(tier.priceAmd, "AMD", rates, locale) : null,
      benefits: pickLocaleList(
        locale,
        { hy: tier.benefitsHy, ru: tier.benefitsRu, en: tier.benefitsEn },
        tier.benefits,
      ),
      image: tier.image ?? null,
      isExclusive: tier.isExclusive,
      availableSlots: tier.availableSlots,
      totalSlots: tier.totalSlots,
    })),
    slotsAvailable: p.tiers.reduce((sum, tier) => sum + (tier.availableSlots ?? 0), 0),
    slotsTotal: p.tiers.reduce((sum, tier) => sum + (tier.totalSlots ?? 0), 0),
    placements: p.placements.map((pl) => ({
      id: pl.id,
      title: pickLocale(locale, { hy: pl.titleHy, ru: pl.titleRu, en: pl.titleEn }, pl.title),
      description: pickLocaleList(
        locale,
        { hy: pl.descriptionHy, ru: pl.descriptionRu, en: pl.descriptionEn },
        pl.description,
      ),
      image: pl.image ?? null,
      // "" when the creator never classified this integration — the card then
      // shows no kind chip rather than an empty one.
      placementType: pl.placementType ?? "",
      priceAmd: pl.priceAmd,
      priceDisplay: pl.priceAmd != null ? formatMoney(pl.priceAmd, currency, rates, locale) : null,
      priceNative: pl.priceAmd != null ? formatMoney(pl.priceAmd, "AMD", rates, locale) : null,
      availableSlots: pl.availableSlots,
      totalSlots: pl.totalSlots,
    })),
    placementsCount: p.placements.length,
    placementTypes: distinctPlacementTypes(p.placements),
    tiersCount: p.tiers.length,
    priceFromDisplay: formatPriceFrom(
      [...p.placements, ...p.tiers].map((o) => o.priceAmd),
      currency,
      rates,
      locale,
    ),
    placementsPriceFromDisplay: formatPriceFrom(
      p.placements.map((o) => o.priceAmd),
      currency,
      rates,
      locale,
    ),
    tiersPriceFromDisplay: formatPriceFrom(
      p.tiers.map((o) => o.priceAmd),
      currency,
      rates,
      locale,
    ),
    attrs: parseAttrs(p.attrs),
    eventCity: p.eventCity,
    eventDate: p.eventDate?.toISOString() ?? null,
    eventCategory: p.eventCategory,
    milestones: p.milestones.map((m) => ({
      id: m.id,
      label: m.label,
      date: m.date?.toISOString() ?? null,
      note: m.note,
      isActive: m.isActive,
    })),
    videoEmbedUrl: p.videoEmbedUrl ?? "",
    videoFile: p.videoFile ?? "",
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
