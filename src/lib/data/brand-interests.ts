import "server-only";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/i18n";
import type { InterestStatus } from "@prisma/client";
import { OFFER_NAME_SELECT, pickPlacementTitle, pickTierName } from "@/lib/data/pick-locale";

/* #23 — Interest is a BRAND member's "Express Interest" signal on a Project.
 * It's the only placement-lead channel now (#37 removed the anonymous
 * Application lead-capture form). Small enough that this file skips
 * unstable_cache — same "owner-scoped, low-traffic" reasoning as
 * brand-profile.ts. */

export type BrandInterestDTO = {
  id: number;
  status: InterestStatus;
  createdAt: string;
  // ── Wave 2 of the audit: the seller can answer now, so the brand has
  // something to read back. Before this, every row said "Sent" forever and no
  // reply existed anywhere (audit 2.2).
  respondedAt: string | null;
  responseNote: string;
  tierName: string; // the sponsorship package applied for, "" when none was picked
  // The product placement applied for (2026-07-29), "" when none was picked.
  // Mutually exclusive with tierName in practice — one picker over both lists.
  placementTitle: string;
  // What the brand itself sent (2026-07-26). It used to be write-only in both
  // directions: the seller couldn't read it, and neither could the brand —
  // its own cabinet showed a status pill and nothing about what was asked for.
  message: string;
  productInfo: string;
  project: {
    id: number;
    title: string;
    genre: string;
    poster: string;
    format: string;
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
    include: {
      project: true,
      // Per-locale offer names (IA-44, 2026-08-05) — this list is the brand's
      // own record of what it applied for, so it has to read in the brand's
      // language, not in whatever the creator typed first.
      tier: { select: OFFER_NAME_SELECT.tier },
      placement: { select: OFFER_NAME_SELECT.placement },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    respondedAt: r.respondedAt?.toISOString() ?? null,
    responseNote: r.responseNote ?? "",
    tierName: pickTierName(locale, r.tier),
    placementTitle: pickPlacementTitle(locale, r.placement),
    message: r.message ?? "",
    productInfo: r.productInfo ?? "",
    project: {
      id: r.project.id,
      title: pickTitle(locale, r.project),
      genre: r.project.genre,
      poster: r.project.poster ?? "",
      format: r.project.format,
    },
  }));
}

/** Live count of the current brand's expressed interests — drives the
 *  sidebar badge (#24), same "small, low-traffic, skip unstable_cache"
 *  reasoning as the rest of this file. */
export async function getBrandInterestCount(brandId: number): Promise<number> {
  return prisma.interest.count({ where: { brandId } });
}

/** What this brand has already applied for on one project, keyed by offer
 *  ("P:5" / "T:3", or "-" for an application that named nothing).
 *
 *  Feeds the report page (IA-6): the apply buttons open already reflecting
 *  SENT / MUTUAL / DECLINED instead of starting from scratch, and the popup
 *  only warns about replacing an application when the offer being applied for
 *  is one the brand already sent. It used to be a single status for the whole
 *  project, which is no longer a question with an answer — a brand can hold an
 *  accepted deal on one placement and a pending application on another. */
export async function getBrandInterestOffers(
  brandId: number,
  projectId: number,
): Promise<Record<string, InterestStatus>> {
  const rows = await prisma.interest.findMany({
    where: { brandId, projectId },
    select: { offerKey: true, status: true },
  });
  return Object.fromEntries(rows.map((r) => [r.offerKey, r.status]));
}
