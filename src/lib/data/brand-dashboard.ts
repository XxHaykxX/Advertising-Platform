import "server-only";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/i18n";

/* #23 — lightweight queries backing the two dashboard widgets that aren't
 * just "the public catalog" (Recommended / Recently Added). Deliberately
 * separate from src/lib/data/projects.ts (public, unstable_cache'd, full
 * DTO) — these are small, brand-cabinet-only shapes and skip caching for
 * the same "owner-scoped, low-traffic" reasoning as the other brand* data
 * files. */

// Duplicated from brand-interests.ts's pickTitle — small enough that a
// shared import isn't worth the coupling (same reasoning the codebase uses
// elsewhere, e.g. account/projects/actions.ts's code-generation comment).
function pickTitle(locale: Locale, p: { title: string; titleHy: string; titleRu: string; titleEn: string }): string {
  const byLocale = locale === "hy" ? p.titleHy : locale === "ru" ? p.titleRu : p.titleEn;
  if (byLocale) return byLocale;
  if (p.titleEn) return p.titleEn;
  return p.title;
}

export type DashboardProjectDTO = {
  id: number;
  title: string;
  genre: string;
  poster: string;
};

// Duplicated from parseGenresInput in admin/projects/form-shared.ts — same
// "small enough that a shared import isn't worth the coupling" reasoning as
// pickTitle above (this is a data-layer file, that one's admin-panel-only).
// Multi-genre JSON string[] -> string[], falling back to the legacy single
// `genre` column when `genres` was never set (pre-migration rows).
function parseProjectGenres(genresJson: string | null, legacyGenre: string): string[] {
  if (genresJson) {
    try {
      const arr = JSON.parse(genresJson);
      if (Array.isArray(arr) && arr.length) return arr;
    } catch {
      // fall through to legacy
    }
  }
  return legacyGenre ? [legacyGenre] : [];
}

/** Number of brandCategories that substring-match one of the project's
 *  genres — same "contains" looseness the original single-field match used,
 *  just counted across the full multi-genre list so results can be ranked
 *  by relevance instead of taken in arbitrary order. */
function matchScore(projectGenres: string[], brandCategories: string[]): number {
  return brandCategories.filter((c) => projectGenres.some((g) => g.includes(c))).length;
}

/** Parses a src/lib/brand-categories.ts BUDGET_RANGES value ("<1M" / "1-5M" /
 *  "5-20M" / "20M+") into an AMD {min,max} bound. Regex-driven rather than a
 *  hardcoded lookup so it stays correct if the option list ever changes;
 *  returns null for an unset/unrecognized value (caller then skips the
 *  budget signal entirely, same as "no budgetRange set"). */
function parseBudgetRangeAmd(value: string): { min: number; max: number } | null {
  const toAmd = (n: string) => parseFloat(n) * 1_000_000;
  let m = value.match(/^<(\d+(?:\.\d+)?)M$/);
  if (m) return { min: 0, max: toAmd(m[1]) };
  m = value.match(/^(\d+(?:\.\d+)?)M\+$/);
  if (m) return { min: toAmd(m[1]), max: Infinity };
  m = value.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)M$/);
  if (m) return { min: toAmd(m[1]), max: toAmd(m[2]) };
  return null;
}

/** The cheapest sponsorship tier on a project — "minimum price" rather than
 *  an average/max, because that's the actual entry cost a brand would face:
 *  a brand only needs ONE package to place in a project, so the tier list's
 *  floor is what determines whether the project is "affordable" for them,
 *  not the priciest (exclusive) tier or some blended figure. Infinity when
 *  the project has no tiers yet (never counts as affordable). */
function minTierPriceAmd(tiers: { priceAmd: number | null }[]): number {
  // Unpriced tiers ("on request", 2026-08-04) are excluded before Math.min —
  // a bare null there coerces to 0 and would make every project with even one
  // unpriced package look free, which is worse than "affordable": it would
  // rank above projects that are genuinely cheap. A project with no PRICED
  // tier at all (whether it has zero tiers or only unpriced ones) never
  // counts as affordable, same as before.
  const priced = tiers.filter((t): t is { priceAmd: number } => t.priceAmd != null);
  return priced.length === 0 ? Infinity : Math.min(...priced.map((t) => t.priceAmd));
}

/** Whether a project's cheapest tier fits inside the brand's selected budget
 *  ceiling (#4.6) — "fits" means at-or-under the range's upper bound, so a
 *  brand with a "5-20M" budget isn't denied a project priced below 5M too;
 *  the range communicates a spending CAP, not a strict bracket. */
function fitsBudget(priceAmd: number, budget: { min: number; max: number } | null): boolean {
  if (!budget) return false;
  return priceAmd <= budget.max;
}

/** Genre-string match against the brand's selected categories (per #23
 *  spec: "простой фильтр" — a real content-based recommender is a
 *  follow-up, not this task), now checking both the legacy `genre` column
 *  and the multi-genre `genres` JSON array, and ranked by how many
 *  categories match (most-relevant first, ties broken by newest). Since
 *  Prisma can't rank by JSON-array match-count in SQL, over-fetch a larger
 *  candidate pool and score+sort in JS. Returns [] when the brand has no
 *  categories set yet OR none of them happen to overlap a genre — the
 *  dashboard shows a "complete your profile" prompt in the latter case too,
 *  since we can't tell the two apart without a stronger match (TODO).
 *
 *  #4.6 — budgetRange (the "" default = not set) now feeds ranking too:
 *  among genre-matched candidates, ones whose cheapest tier fits the brand's
 *  budget ceiling are boosted above equally-genre-relevant ones that don't;
 *  and if genre matches alone don't fill `limit`, additional budget-fitting
 *  projects (regardless of genre) backfill the rest — "попадают в подборку"
 *  per the audit item, not just "идут выше" among matches that already
 *  qualified. When budgetRange is "" or unrecognized, fitsBudget() always
 *  returns false, so ranking/backfill degrade to the pre-#4.6 behavior
 *  exactly (genre-only, no bonus, no backfill). */
export async function getRecommendedProjects(
  locale: Locale,
  brandCategories: string[],
  budgetRange = "",
  limit = 3,
): Promise<DashboardProjectDTO[]> {
  if (brandCategories.length === 0) return [];

  const budget = parseBudgetRangeAmd(budgetRange);

  const candidates = await prisma.project.findMany({
    where: {
      isActive: true,
      moderationStatus: "APPROVED",
      OR: brandCategories.flatMap((c) => [{ genre: { contains: c } }, { genres: { contains: c } }]),
    },
    orderBy: { createdAt: "desc" },
    take: limit * 4,
    include: { tiers: { select: { priceAmd: true } } },
  });

  const ranked = candidates
    .map((p) => ({
      p,
      score: matchScore(parseProjectGenres(p.genres, p.genre), brandCategories),
      fits: fitsBudget(minTierPriceAmd(p.tiers), budget),
    }))
    .filter(({ score }) => score > 0)
    // Primary: genre relevance (unchanged). Secondary: budget fit — a bonus
    // among equally-relevant candidates, never overriding genre relevance
    // itself. Tertiary: newest first, as before.
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.fits) - Number(a.fits) ||
        b.p.createdAt.getTime() - a.p.createdAt.getTime(),
    )
    .slice(0, limit);

  // Backfill: if genre matches didn't fill the slate and the brand has a
  // budget set, top up with the newest budget-fitting projects regardless of
  // genre (excluding anything already picked above) — this is the "попадают
  // в подборку" half of #4.6, not just a re-ranking of existing matches.
  let backfill: (typeof candidates)[number][] = [];
  if (ranked.length < limit && budget) {
    const rankedIds = new Set(ranked.map(({ p }) => p.id));
    const pool = await prisma.project.findMany({
      where: {
        isActive: true,
        moderationStatus: "APPROVED",
        id: { notIn: Array.from(rankedIds) },
      },
      orderBy: { createdAt: "desc" },
      take: (limit - ranked.length) * 4,
      include: { tiers: { select: { priceAmd: true } } },
    });
    backfill = pool
      .filter((p) => fitsBudget(minTierPriceAmd(p.tiers), budget))
      .slice(0, limit - ranked.length);
  }

  const combined = [...ranked.map(({ p }) => p), ...backfill];
  return combined.map((p) => ({
    id: p.id,
    title: pickTitle(locale, p),
    genre: p.genre,
    poster: p.poster ?? "",
  }));
}

/** Latest approved, active projects — "Recently Added". */
export async function getRecentProjects(locale: Locale, limit = 4): Promise<DashboardProjectDTO[]> {
  const rows = await prisma.project.findMany({
    where: { isActive: true, moderationStatus: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((p) => ({
    id: p.id,
    title: pickTitle(locale, p),
    genre: p.genre,
    poster: p.poster ?? "",
  }));
}
