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

/** Simple genre-string match against the brand's selected categories (per
 *  #23 spec: "простой фильтр" — a real content-based recommender is a
 *  follow-up, not this task). Returns [] when the brand has no categories
 *  set yet OR none of them happen to overlap a genre string — the dashboard
 *  shows a "complete your profile" prompt in the latter case too, since we
 *  can't tell the two apart without a stronger match (TODO). */
export async function getRecommendedProjects(
  locale: Locale,
  brandCategories: string[],
  limit = 3,
): Promise<DashboardProjectDTO[]> {
  if (brandCategories.length === 0) return [];

  const rows = await prisma.project.findMany({
    where: {
      isActive: true,
      moderationStatus: "APPROVED",
      OR: brandCategories.map((c) => ({ genre: { contains: c } })),
    },
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
