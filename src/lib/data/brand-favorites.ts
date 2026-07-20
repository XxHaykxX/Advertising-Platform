import "server-only";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/i18n";

/* #22 — Favorite is a BRAND member's private shortlist heart on a project
 * card (separate from Interest — admins never see it). Same
 * "owner-scoped, low-traffic" reasoning as brand-interests.ts for skipping
 * unstable_cache. */

export type BrandFavoriteDTO = {
  id: number;
  createdAt: string;
  project: {
    id: number;
    code: string;
    title: string;
    genre: string;
    poster: string;
    format: string;
    releaseLabel: string;
  };
};

// Locale → en → base fallback, same order as pickLocale() in
// src/lib/data/projects.ts — deliberately duplicated (small, different trust
// zone) rather than importing a non-exported helper from that module.
function pickTitle(
  locale: Locale,
  p: { title: string; titleHy: string; titleRu: string; titleEn: string },
): string {
  const byLocale = locale === "hy" ? p.titleHy : locale === "ru" ? p.titleRu : p.titleEn;
  if (byLocale) return byLocale;
  if (p.titleEn) return p.titleEn;
  return p.title;
}

export async function getBrandFavorites(brandId: number, locale: Locale): Promise<BrandFavoriteDTO[]> {
  const rows = await prisma.favorite.findMany({
    where: { brandId },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    project: {
      id: r.project.id,
      code: r.project.code,
      title: pickTitle(locale, r.project),
      genre: r.project.genre,
      poster: r.project.poster ?? "",
      format: r.project.format,
      releaseLabel: r.project.releaseLabel,
    },
  }));
}
