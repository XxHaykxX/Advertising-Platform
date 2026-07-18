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
  code: string;
  title: string;
  genre: string;
  poster: string;
  releaseLabel: string;
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

/** Genre-string match against the brand's selected categories (per #23
 *  spec: "простой фильтр" — a real content-based recommender is a
 *  follow-up, not this task), now checking both the legacy `genre` column
 *  and the multi-genre `genres` JSON array, and ranked by how many
 *  categories match (most-relevant first, ties broken by newest). Since
 *  Prisma can't rank by JSON-array match-count in SQL, over-fetch a larger
 *  candidate pool and score+sort in JS. Returns [] when the brand has no
 *  categories set yet OR none of them happen to overlap a genre — the
 *  dashboard shows a "complete your profile" prompt in the latter case too,
 *  since we can't tell the two apart without a stronger match (TODO). */
export async function getRecommendedProjects(
  locale: Locale,
  brandCategories: string[],
  limit = 3,
): Promise<DashboardProjectDTO[]> {
  if (brandCategories.length === 0) return [];

  const candidates = await prisma.project.findMany({
    where: {
      isActive: true,
      moderationStatus: "APPROVED",
      OR: brandCategories.flatMap((c) => [{ genre: { contains: c } }, { genres: { contains: c } }]),
    },
    orderBy: { createdAt: "desc" },
    take: limit * 4,
  });

  const ranked = candidates
    .map((p) => ({ p, score: matchScore(parseProjectGenres(p.genres, p.genre), brandCategories) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.p.createdAt.getTime() - a.p.createdAt.getTime())
    .slice(0, limit);

  return ranked.map(({ p }) => ({
    id: p.id,
    code: p.code,
    title: pickTitle(locale, p),
    genre: p.genre,
    poster: p.poster ?? "",
    releaseLabel: p.releaseLabel,
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
    code: p.code,
    title: pickTitle(locale, p),
    genre: p.genre,
    poster: p.poster ?? "",
    releaseLabel: p.releaseLabel,
  }));
}
