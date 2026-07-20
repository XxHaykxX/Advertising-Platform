"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

/* #22 — Favorite is a BRAND member's private shortlist heart on a project
 * card (separate from Interest — admins never see it). Same defense-in-depth
 * guard shape as actions.ts's expressInterest/withdrawInterest. No
 * notifications: favorites are private, nobody needs to be told about them. */

function revalidateFavoritePaths() {
  revalidatePath("/account/brand/browse");
  revalidatePath("/catalog");
}

export type FavoriteResult = { ok: true } | { ok: false; error: string };

/** Add `projectId` to the current BRAND member's favorites. Upsert instead
 *  of create — a repeat click (double toggle race) is a no-op, not a
 *  unique-constraint throw. */
export async function addFavorite(projectId: number): Promise<FavoriteResult> {
  const user = await requireMember();
  const locale = await getLocale();
  const t = makeUI(locale);
  if (user.role !== "BRAND") return { ok: false, error: t("account.brand.expressInterestError") };

  if (!Number.isInteger(projectId)) return { ok: false, error: t("account.brand.expressInterestError") };

  try {
    await prisma.favorite.upsert({
      where: { brandId_projectId: { brandId: user.id, projectId } },
      create: { brandId: user.id, projectId },
      update: {},
    });
  } catch {
    return { ok: false, error: t("account.brand.expressInterestError") };
  }

  revalidateFavoritePaths();
  return { ok: true };
}

/** Remove `projectId` from the current BRAND member's favorites. deleteMany
 *  (not delete) so an already-removed race is a no-op instead of a P2025
 *  throw. */
export async function removeFavorite(projectId: number): Promise<FavoriteResult> {
  const user = await requireMember();
  const locale = await getLocale();
  const t = makeUI(locale);
  if (user.role !== "BRAND") return { ok: false, error: t("account.brand.expressInterestError") };

  if (!Number.isInteger(projectId)) return { ok: false, error: t("account.brand.expressInterestError") };

  try {
    await prisma.favorite.deleteMany({ where: { brandId: user.id, projectId } });
  } catch {
    return { ok: false, error: t("account.brand.expressInterestError") };
  }

  revalidateFavoritePaths();
  return { ok: true };
}
