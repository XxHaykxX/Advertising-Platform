import "server-only";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/i18n";
import type { InterestStatus } from "@prisma/client";

/* #23 — Interest is a BRAND member's "Express Interest" signal on a Project,
 * distinct from the anonymous Application lead-capture form (src/lib/actions
 * /applications.ts). Small enough that this file skips unstable_cache — same
 * "owner-scoped, low-traffic" reasoning as brand-profile.ts. */

export type BrandInterestDTO = {
  id: number;
  status: InterestStatus;
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

export async function getBrandInterests(brandId: number, locale: Locale): Promise<BrandInterestDTO[]> {
  const rows = await prisma.interest.findMany({
    where: { brandId },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
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

/** projectId -> Interest, for the Browse grid (disables/relabels the
 *  "Express Interest" button on projects the brand already signalled). */
export async function getBrandInterestMap(brandId: number): Promise<Map<number, BrandInterestDTO["status"]>> {
  const rows = await prisma.interest.findMany({
    where: { brandId },
    select: { projectId: true, status: true },
  });
  return new Map(rows.map((r) => [r.projectId, r.status]));
}
