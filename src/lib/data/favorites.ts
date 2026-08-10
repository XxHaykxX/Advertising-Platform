import "server-only";
import { prisma } from "@/lib/prisma";

/* #22 — Favorite is a BRAND member's private shortlist heart on a project
 * card, separate from Interest: admins never see it. Small/owner-scoped/
 * low-traffic, same "skip unstable_cache" reasoning as brand-interests.ts. */

/** projectIds the brand has favorited — feeds the heart's initial filled/
 *  outline state on the Browse grid and public catalog. */
export async function getBrandFavoriteSet(brandId: number): Promise<Set<number>> {
  const rows = await prisma.favorite.findMany({
    where: { brandId },
    select: { projectId: true },
  });
  return new Set(rows.map((r) => r.projectId));
}

/** projectIds the given user OWNS (2026-08-11, dual-side accounts) — feeds
 *  the `ownIds` prop that keeps a dual member from applying/favoriting their
 *  own listing. Callers skip this entirely for anyone who can't sell (same
 *  "only fetch what a side needs" rule as the projectCount/interestCount in
 *  site-header-user.ts). */
export async function getOwnedProjectIdSet(ownerId: number): Promise<Set<number>> {
  const rows = await prisma.project.findMany({
    where: { ownerId },
    select: { id: true },
  });
  return new Set(rows.map((r) => r.id));
}
