"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { getBrandProfile } from "@/lib/data/brand-profile";
import { getBrandInterestCount, getBrandInterests } from "@/lib/data/brand-interests";
import { BRAND_CATEGORIES, BUDGET_RANGES } from "@/lib/brand-categories";
import { makeUI } from "@/lib/i18n";
import { createNotification, notifyRoles } from "@/lib/data/notifications";
import { notifyNewInterest } from "@/lib/mail";

/* #23 — BRAND-cabinet server actions. Every action re-checks requireMember()
 * + role === "BRAND" itself (defense in depth — the layout gate already
 * bounces non-brand members, but actions are reachable via direct POST). */

function revalidateBrandPaths() {
  revalidatePath("/account/brand");
  revalidatePath("/account/brand/browse");
  revalidatePath("/account/brand/interests");
  revalidatePath("/account/brand/profile");
}

export type ExpressInterestResult = { ok: true } | { ok: false; error: string };

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

/** #23 — the report page's Express Interest button now opens a popup asking
 *  for an application message + optional contact instead of instant-toggling.
 *  Upsert (not create-only) so a resend after MUTUAL/DECLINED — unlike
 *  expressInterest's no-op update — overwrites the message/contact and
 *  resets status back to SENT, since a fresh application is meant to reopen
 *  the conversation. Always notifies (not just on a brand-new row): the
 *  brand may be resubmitting with new details the admin should see. */
/** The three brief fields the popup asks for on top of the free-text message
 *  (2026-07-26). All optional; unknown dealType values are dropped rather than
 *  stored, so a crafted POST can't put arbitrary text where the UI shows a
 *  fixed label. */
export type ApplicationBrief = {
  productInfo?: string;
  desiredTiming?: string;
  dealType?: string;
};

const DEAL_TYPES = ["CASH", "BARTER", "BOTH"];
/** Shortest application accepted. Mirrors MIN_MESSAGE in application-dialog —
 *  the popup disables submit below this, and this rejects a direct POST. */
const MIN_MESSAGE = 20;

export async function submitApplication(
  projectId: number,
  message: string,
  contact: string,
  tierId?: number | null,
  brief?: ApplicationBrief,
): Promise<ExpressInterestResult> {
  const user = await requireMember();
  const locale = await getLocale();
  const t = makeUI(locale);
  if (user.role !== "BRAND") return { ok: false, error: t("account.brand.expressInterestError") };

  if (!Number.isInteger(projectId)) return { ok: false, error: t("account.brand.expressInterestError") };

  const trimmedMessage = message.trim().slice(0, 2000) || null;
  const trimmedContact = contact.trim().slice(0, 191) || null;
  // Message is required (the popup enforces it client-side too) — reject an
  // empty application submitted via a direct POST. Since 2026-07-26 it must
  // also actually say something: a one-word "hi" is not an application the
  // seller can answer.
  if (!trimmedMessage || trimmedMessage.length < MIN_MESSAGE) {
    return { ok: false, error: t("account.brand.applyTooShort") };
  }

  const productInfo = (brief?.productInfo ?? "").trim().slice(0, 2000) || null;
  const desiredTiming = (brief?.desiredTiming ?? "").trim().slice(0, 191) || null;
  const dealTypeRaw = (brief?.dealType ?? "").trim();
  const dealType = DEAL_TYPES.includes(dealTypeRaw) ? dealTypeRaw : null;

  // The package the brand is applying for (audit 2.3 — an application used to
  // say nothing about which placement or price it was about). Verified to
  // belong to this project so a crafted POST can't attach someone else's tier.
  let resolvedTierId: number | null = null;
  if (tierId != null && Number.isInteger(tierId)) {
    const tier = await prisma.sponsorshipTier.findFirst({
      where: { id: tierId, projectId },
      select: { id: true },
    });
    resolvedTierId = tier?.id ?? null;
  }

  // Snapshot the application as it stands BEFORE the upsert overwrites it:
  // resending switches packages, and the slot to release belongs to the OLD
  // tier. Reading it afterwards would hand the slot back to the new package
  // instead, quietly leaking the old one.
  const previous = await prisma.interest.findUnique({
    where: { brandId_projectId: { brandId: user.id, projectId } },
    select: { slotReserved: true, tierId: true },
  });

  let interestId: number;
  try {
    const saved = await prisma.interest.upsert({
      where: { brandId_projectId: { brandId: user.id, projectId } },
      create: {
        brandId: user.id,
        projectId,
        status: "SENT",
        message: trimmedMessage,
        contact: trimmedContact,
        tierId: resolvedTierId,
        productInfo,
        desiredTiming,
        dealType,
      },
      // A resend reopens the conversation: back to SENT, new message, and any
      // slot the previous answer had taken is released below.
      update: {
        status: "SENT",
        message: trimmedMessage,
        contact: trimmedContact,
        tierId: resolvedTierId,
        productInfo,
        desiredTiming,
        dealType,
        respondedAt: null,
        responseNote: null,
      },
      select: { id: true },
    });
    interestId = saved.id;

    // The previous round of this application is not overwritten any more — it
    // stays in the history (audit 2.6).
    await prisma.interestEvent.create({
      data: {
        interestId: saved.id,
        kind: "APPLICATION",
        status: "SENT",
        body: trimmedMessage,
        contact: trimmedContact,
        // Snapshot the brief with the round it was sent in, so resending with
        // new terms doesn't rewrite what was originally offered.
        productInfo,
        desiredTiming,
        dealType,
        authorId: user.id,
      },
    });

    // Reopening frees the slot the earlier acceptance held, so it can't stay
    // booked by an application that is pending again. `availableSlots: null`
    // means "capacity unspecified" — incrementing that is meaningless (and in
    // MySQL just yields NULL), so only counted packages are touched.
    if (previous?.slotReserved && previous.tierId != null) {
      const previousTier = await prisma.sponsorshipTier.findUnique({
        where: { id: previous.tierId },
        select: { availableSlots: true },
      });
      const ops: Prisma.PrismaPromise<unknown>[] = [
        prisma.interest.update({ where: { id: saved.id }, data: { slotReserved: false } }),
      ];
      if (previousTier?.availableSlots != null) {
        ops.unshift(
          prisma.sponsorshipTier.update({
            where: { id: previous.tierId },
            data: { availableSlots: { increment: 1 } },
          }),
        );
      }
      await prisma.$transaction(ops);
    }
  } catch {
    return { ok: false, error: t("account.brand.expressInterestError") };
  }

  // Notification is best-effort — the application is already saved, so a DB
  // hiccup here must not 500 the request or fail the submit.
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true, title: true, owner: { select: { email: true } } },
    });
    if (project) {
      const payload = {
        type: "INTEREST" as const,
        data: { projectId, projectTitle: project.title, brandName: user.name },
      };
      // Owning creator (or staff owner) — link straight to the application.
      await createNotification(project.ownerId, { ...payload, link: "/account/interests" });
      // Superadmins watch all interests; exclude the owner to avoid a duplicate.
      await notifyRoles(["SUPERADMIN"], { ...payload, link: "/admin/interests" }, project.ownerId);
      // Audit 2.7: only in-app + push went out before, so a creator who doesn't
      // open the cabinet never learned a lead had arrived.
      const tierName = resolvedTierId
        ? (await prisma.sponsorshipTier.findUnique({ where: { id: resolvedTierId }, select: { name: true } }))?.name
        : undefined;
      // The brand's own budget bracket, resolved to its label here: the email
      // is tri-lingual and has no locale to localize with. Read from the DB —
      // AuthedUser carries only id/email/role/name/isActive.
      const brandRow = await prisma.user.findUnique({
        where: { id: user.id },
        select: { budgetRange: true },
      });
      const budgetLabel = brandRow?.budgetRange
        ? (BUDGET_RANGES.find((b) => b.value === brandRow.budgetRange)?.label ?? brandRow.budgetRange)
        : undefined;
      await notifyNewInterest(
        {
          projectId,
          projectTitle: project.title,
          brandName: user.name,
          tierName,
          message: trimmedMessage ?? undefined,
          contact: trimmedContact ?? user.email,
          productInfo: productInfo ?? undefined,
          desiredTiming: desiredTiming ?? undefined,
          dealType: dealType ?? undefined,
          brandBudget: budgetLabel,
        },
        project.owner.email,
      );
    }
  } catch {
    // best-effort notification — ignore
  }

  void interestId;
  revalidateBrandPaths();
  revalidatePath("/account/interests");
  revalidatePath("/admin/interests");
  return { ok: true };
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
