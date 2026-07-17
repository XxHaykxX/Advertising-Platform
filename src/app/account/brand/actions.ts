"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { getBrandProfile } from "@/lib/data/brand-profile";
import { getBrandInterestCount, getBrandInterests } from "@/lib/data/brand-interests";
import { BRAND_CATEGORIES, BUDGET_RANGES } from "@/lib/brand-categories";
import { makeUI } from "@/lib/i18n";
import { createNotification, notifyRoles } from "@/lib/data/notifications";

/* #23 — BRAND-cabinet server actions. Every action re-checks requireMember()
 * + role === "BRAND" itself (defense in depth — the layout gate already
 * bounces non-brand members, but actions are reachable via direct POST). */

function revalidateBrandPaths() {
  revalidatePath("/account/brand");
  revalidatePath("/account/brand/browse");
  revalidatePath("/account/brand/interests");
}

export type ExpressInterestResult = { ok: true } | { ok: false; error: string };

/** Create (or no-op if it already exists) a SENT Interest row for the current
 *  BRAND member on `projectId`. Upsert instead of create — a project already
 *  in MUTUAL/DECLINED must not be silently reset back to SENT by a repeat
 *  click, so `update: {}` is intentionally a no-op. */
export async function expressInterest(projectId: number): Promise<ExpressInterestResult> {
  const user = await requireMember();
  const locale = await getLocale();
  const t = makeUI(locale);
  if (user.role !== "BRAND") return { ok: false, error: t("account.brand.expressInterestError") };

  if (!Number.isInteger(projectId)) return { ok: false, error: t("account.brand.expressInterestError") };

  let isNew = false;
  try {
    const existing = await prisma.interest.findUnique({
      where: { brandId_projectId: { brandId: user.id, projectId } },
      select: { id: true },
    });
    isNew = !existing;
    await prisma.interest.upsert({
      where: { brandId_projectId: { brandId: user.id, projectId } },
      create: { brandId: user.id, projectId, status: "SENT" },
      update: {},
    });
  } catch {
    return { ok: false, error: t("account.brand.expressInterestError") };
  }

  // Notify only on a genuinely new interest — a repeat click (upsert no-op)
  // must not re-notify. Notification failures never fail the interest itself.
  if (isNew) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true, title: true },
    });
    if (project) {
      const payload = {
        type: "INTEREST" as const,
        data: { projectId, projectTitle: project.title, brandName: user.name },
      };
      // Owning creator (or staff owner) — link to the public report they can view.
      await createNotification(project.ownerId, { ...payload, link: `/reports/${projectId}` });
      // Superadmins watch all interests; exclude the owner to avoid a duplicate.
      await notifyRoles(["SUPERADMIN"], { ...payload, link: "/admin/interests" }, project.ownerId);
    }
  }

  revalidateBrandPaths();
  return { ok: true };
}

/** Delete the current BRAND member's Interest row on `projectId` — the other
 *  half of the toggle (expressInterest ⇄ withdrawInterest). deleteMany (not
 *  delete) so a double-click / already-withdrawn race is a no-op instead of
 *  a P2025 "record not found" throw. */
export async function withdrawInterest(projectId: number): Promise<ExpressInterestResult> {
  const user = await requireMember();
  const locale = await getLocale();
  const t = makeUI(locale);
  if (user.role !== "BRAND") return { ok: false, error: t("account.brand.expressInterestError") };

  if (!Number.isInteger(projectId)) return { ok: false, error: t("account.brand.expressInterestError") };

  try {
    await prisma.interest.deleteMany({ where: { brandId: user.id, projectId } });
  } catch {
    return { ok: false, error: t("account.brand.expressInterestError") };
  }

  revalidateBrandPaths();
  return { ok: true };
}

/** Current BRAND member's interest count — feeds the sidebar badge, same
 *  direct-Server-Action-call pattern as admin-nav's getPendingModerationCount. */
export async function getInterestCount(): Promise<number> {
  const user = await requireMember();
  if (user.role !== "BRAND") return 0;
  return getBrandInterestCount(user.id);
}

export type BrandProfileFormState = {
  error?: string;
  ok?: boolean;
};

function jsonArray(fd: FormData, key: string): string[] {
  try {
    const a = JSON.parse(String(fd.get(key) || "[]"));
    return Array.isArray(a) ? a.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

const VARCHAR_MAX = 191;
const BUDGET_VALUES = BUDGET_RANGES.map((b) => b.value);

/** Update the current BRAND member's company/website/categories/budget.
 *  Categories are filtered against BRAND_CATEGORIES (closed set — unlike
 *  genres.ts, there's no allowCustom here); budgetRange against
 *  BUDGET_RANGES. Email is never editable from this form. */
export async function updateBrandProfile(
  _prev: BrandProfileFormState,
  fd: FormData,
): Promise<BrandProfileFormState> {
  const user = await requireMember();
  const locale = await getLocale();
  const t = makeUI(locale);
  if (user.role !== "BRAND") return { error: t("account.brand.expressInterestError") };

  const company = String(fd.get("company") || "").trim().slice(0, VARCHAR_MAX);
  const website = String(fd.get("website") || "").trim().slice(0, VARCHAR_MAX);
  const categories = jsonArray(fd, "brandCategories").filter((c) => BRAND_CATEGORIES.includes(c));
  const budgetRangeRaw = String(fd.get("budgetRange") || "");
  const budgetRange = BUDGET_VALUES.includes(budgetRangeRaw) ? budgetRangeRaw : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      company: company || null,
      website: website || null,
      brandCategories: JSON.stringify(categories),
      budgetRange,
    },
  });

  revalidateBrandPaths();
  return { ok: true };
}

/** Returns a JSON dump of the brand's own profile + expressed interests
 *  (the "Download my data" button — client-side triggers a Blob download
 *  from this string, no separate API route needed). */
export async function getBrandDataExport(): Promise<string> {
  const user = await requireMember();
  if (user.role !== "BRAND") return JSON.stringify({ error: "forbidden" });

  const locale = await getLocale();
  const [profile, interests] = await Promise.all([
    getBrandProfile(user.id),
    getBrandInterests(user.id, locale),
  ]);

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      profile,
      interests,
    },
    null,
    2,
  );
}
