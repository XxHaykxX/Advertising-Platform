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
