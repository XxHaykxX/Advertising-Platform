"use server";

import { revalidatePath, updateTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth/require";
import { canBuy } from "@/lib/auth/capabilities";
import { getLocale } from "@/lib/data/locale";
import { getBrandProfile } from "@/lib/data/brand-profile";
import { getBrandInterestCount, getBrandInterests } from "@/lib/data/brand-interests";
import { BRAND_CATEGORIES, BUDGET_RANGES } from "@/lib/brand-categories";
import { DEFAULT_LOCALE, makeUI } from "@/lib/i18n";
import { notifyRoles } from "@/lib/data/notifications";
import { notifyNewInterestToStaff } from "@/lib/mail";
import { OFFER_NAME_SELECT, pickPlacementTitle, pickTierName } from "@/lib/data/pick-locale";
import { offerKeyOf } from "@/lib/offer-value";
import { isValidPhone } from "@/lib/phone";
import { parseWebsiteUrl } from "@/lib/website-url";

/* #23 — BRAND-cabinet server actions. Every action re-checks requireMember()
 * + canBuy() itself (defense in depth — the layout gate already bounces
 * non-buying members, but actions are reachable via direct POST). */

function revalidateBrandPaths() {
  revalidatePath("/account/brand");
  // The listings a brand applies from carry the free-slot counts an interest
  // can move. "layout" covers the whole section in one call — the four group
  // pages, the nine channel pages and every ad-space card under them.
  revalidatePath("/ads", "layout");
  revalidatePath("/account/brand/interests");
  revalidatePath("/account/brand/profile");
}

export type ExpressInterestResult = { ok: true } | { ok: false; error: string };

/** Withdraw ONE of the current brand's applications.
 *
 *  Takes the application's own id, not a project id: since 2026-07-29 a brand
 *  can hold several applications on one project — one per placement or package
 *  — and "remove" on a row in the cabinet must take that row away, not every
 *  application for that film. The `brandId` in the filter is what makes it the
 *  brand's own: an id belonging to somebody else matches nothing.
 *
 *  deleteMany (not delete) so a double-click, or a row already withdrawn in
 *  another tab, is a no-op instead of a P2025 "record not found" throw.
 *
 *  A withdrawn application that was accepted gives its slot back — otherwise
 *  the package would stay booked by a deal that no longer exists. */
export async function withdrawInterest(interestId: number): Promise<ExpressInterestResult> {
  const user = await requireMember();
  const locale = await getLocale();
  const t = makeUI(locale);
  if (!canBuy(user)) return { ok: false, error: t("account.brand.expressInterestError") };

  if (!Number.isInteger(interestId)) return { ok: false, error: t("account.brand.expressInterestError") };

  try {
    const row = await prisma.interest.findFirst({
      where: { id: interestId, brandId: user.id },
      select: { id: true, slotReserved: true, tierId: true, placementId: true },
    });
    // Already gone (or never theirs) — nothing to undo, and saying so would
    // tell a caller whether somebody else's application exists.
    if (!row) {
      revalidateBrandPaths();
      return { ok: true };
    }

    await prisma.$transaction(async (tx) => {
      await tx.interest.deleteMany({ where: { id: row.id, brandId: user.id } });
      if (!row.slotReserved) return;
      // `availableSlots: null` means "capacity unspecified" — incrementing
      // that is meaningless (and in MySQL yields NULL), so only counted rows
      // are touched.
      if (row.tierId != null) {
        const tier = await tx.sponsorshipTier.findUnique({
          where: { id: row.tierId },
          select: { availableSlots: true },
        });
        if (tier?.availableSlots != null) {
          await tx.sponsorshipTier.update({
            where: { id: row.tierId },
            data: { availableSlots: { increment: 1 } },
          });
        }
      } else if (row.placementId != null) {
        const placement = await tx.placement.findUnique({
          where: { id: row.placementId },
          select: { availableSlots: true },
        });
        if (placement?.availableSlots != null) {
          await tx.placement.update({
            where: { id: row.placementId },
            data: { availableSlots: { increment: 1 } },
          });
        }
      }
    });
  } catch {
    return { ok: false, error: t("account.brand.expressInterestError") };
  }

  // Withdrawing an accepted application gives its slot back, and slot counts
  // are part of the cached catalog DTOs — same reasoning as respondToInterest.
  updateTag("projects");
  revalidateBrandPaths();
  revalidatePath("/admin/interests");
  return { ok: true };
}

/** Current BRAND member's interest count — feeds the sidebar badge, same
 *  direct-Server-Action-call pattern as admin-nav's getPendingModerationCount. */
export async function getInterestCount(): Promise<number> {
  const user = await requireMember();
  if (!canBuy(user)) return 0;
  return getBrandInterestCount(user.id);
}

/** #23 — the report page's Express Interest button now opens a popup asking
 *  for an application message + optional contact instead of instant-toggling.
 *  Upsert (not create-only) so a resend after MUTUAL/DECLINED — unlike
 *  expressInterest's no-op update — overwrites the message/contact and
 *  resets status back to SENT, since a fresh application is meant to reopen
 *  the conversation. Always notifies (not just on a brand-new row): the
 *  brand may be resubmitting with new details the admin should see. */
/** What the popup asks for on top of the free-text message. The brief used to
 *  carry three more answers — the brand's own price, the deal type and the
 *  preferred timing — dropped on the owner's call 2026-08-05 as belonging to
 *  the negotiation rather than to the form that opens it. Anything still sent
 *  under those names by a stale client is ignored, not stored. */
export type ApplicationBrief = {
  productInfo?: string;
  /** Required since 2026-07-26 — the seller must be able to call back. */
  phone?: string;
};

/** Which of the two things on sale the application is for. Product placement
 *  and sponsorship are separate rows in separate tables, so the id alone would
 *  be ambiguous. */
export type ApplicationOfferRef = { kind: "PLACEMENT" | "TIER"; id: number };

/** Shortest application accepted. Mirrors MIN_MESSAGE in application-dialog —
 *  the popup disables submit below this, and this rejects a direct POST. */
const MIN_MESSAGE = 20;

export async function submitApplication(
  projectId: number,
  message: string,
  contact: string,
  offer?: ApplicationOfferRef | null,
  brief?: ApplicationBrief,
): Promise<ExpressInterestResult> {
  const user = await requireMember();
  const locale = await getLocale();
  const t = makeUI(locale);
  if (!canBuy(user)) return { ok: false, error: t("account.brand.expressInterestError") };

  if (!Number.isInteger(projectId)) return { ok: false, error: t("account.brand.expressInterestError") };

  // Only a published listing can be applied for. Nothing checked this before:
  // the popup is reachable only from a page a brand can open, but a crafted
  // POST could aim at a project still waiting for moderation, at a rejected
  // one, or at one taken off the catalog — and the creator would get a lead
  // on something not actually on sale.
  const listing = await prisma.project.findUnique({
    where: { id: projectId },
    select: { isActive: true, moderationStatus: true, ownerId: true },
  });
  if (!listing || !listing.isActive || listing.moderationStatus !== "APPROVED") {
    return { ok: false, error: t("account.brand.applyNotAvailable") };
  }
  // Nobody buys from themselves (2026-08-11, dual-side accounts) — a member
  // who also sells could otherwise apply to their own listing. A distinct
  // error from applyNotAvailable above: that one means "not for sale", this
  // one means "yours" — telling those apart is the whole point of a
  // dedicated message here.
  if (listing.ownerId === user.id) {
    return { ok: false, error: t("account.brand.selfApplyError") };
  }

  const trimmedMessage = message.trim().slice(0, 2000) || null;
  const trimmedContact = contact.trim().slice(0, 191) || null;
  // The free-text message is optional since 2026-07-29 — what is being placed
  // (below) is the fact the seller cannot answer without, and requiring both
  // only pushed brands into padding a box. A message that IS written still has
  // to say something: a one-word "hi" is not an application anyone can answer.
  if (trimmedMessage && trimmedMessage.length < MIN_MESSAGE) {
    return { ok: false, error: t("account.brand.applyTooShort") };
  }

  const phone = (brief?.phone ?? "").trim().slice(0, 32);
  if (!isValidPhone(phone)) return { ok: false, error: t("account.brand.applyPhoneRequired") };

  const productInfo = (brief?.productInfo ?? "").trim().slice(0, 2000) || null;
  // Required as of 2026-07-29 (it swapped places with the message). Rejected
  // here too, not only in the popup, so a direct POST can't produce a lead
  // that says nothing about the product.
  if (!productInfo) return { ok: false, error: t("account.brand.applyProductRequired") };

  // What the brand is applying for (audit 2.3 — an application used to say
  // nothing about which placement or price it was about). Since 2026-07-29
  // that is either a product placement or a sponsorship package; both are
  // verified to belong to THIS project, so a crafted POST can't attach a row
  // from someone else's listing.
  let resolvedTierId: number | null = null;
  let resolvedPlacementId: number | null = null;
  if (offer && Number.isInteger(offer.id)) {
    if (offer.kind === "TIER") {
      const tier = await prisma.sponsorshipTier.findFirst({
        where: { id: offer.id, projectId },
        select: { id: true },
      });
      resolvedTierId = tier?.id ?? null;
    } else if (offer.kind === "PLACEMENT") {
      const placement = await prisma.placement.findFirst({
        where: { id: offer.id, projectId },
        select: { id: true },
      });
      resolvedPlacementId = placement?.id ?? null;
    }
  }

  // Which application this is. Keyed by the offer, not by the project: a brand
  // interested in two placements of the same film holds two applications, and
  // sending the second must not touch the first (owner decision 2026-07-29 —
  // it used to overwrite it, accepted deal and reserved slot included).
  const offerKey = offerKeyOf(resolvedTierId, resolvedPlacementId);

  // Snapshot THIS application as it stands before the upsert overwrites it. A
  // resend on the same offer reopens it, so a slot its earlier acceptance held
  // has to go back on sale; reading the row afterwards would show the new
  // state and the slot would leak.
  const previous = await prisma.interest.findUnique({
    where: { brandId_projectId_offerKey: { brandId: user.id, projectId, offerKey } },
    select: { slotReserved: true, tierId: true, placementId: true },
  });

  let interestId: number;
  try {
    const saved = await prisma.interest.upsert({
      where: { brandId_projectId_offerKey: { brandId: user.id, projectId, offerKey } },
      create: {
        brandId: user.id,
        projectId,
        offerKey,
        status: "SENT",
        message: trimmedMessage,
        contact: trimmedContact,
        tierId: resolvedTierId,
        placementId: resolvedPlacementId,
        productInfo,
      },
      // A resend for the SAME offer reopens that conversation: back to SENT,
      // new message, and any slot the previous answer had taken is released
      // below. tierId/placementId are not written here — they are what the key
      // is derived from, so on this branch they already hold these values.
      update: {
        status: "SENT",
        message: trimmedMessage,
        contact: trimmedContact,
        productInfo,
        respondedAt: null,
        responseNote: null,
      },
      select: { id: true },
    });
    interestId = saved.id;

    // Keep the profile's phone in step with the last application, so the
    // seller's "Contact" block shows a number that is actually current — and
    // a returning buyer gets the field prefilled next time.
    await prisma.user.update({ where: { id: user.id }, data: { phone } });

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
        authorId: user.id,
      },
    });

    // Reopening frees the slot the earlier acceptance held, so it can't stay
    // booked by an application that is pending again.
    //
    // Both kinds of offer, not just packages: a brand applies for a product
    // placement too since 2026-07-29, and the placement branch was missing —
    // a resend on an accepted placement reopened the application but left its
    // slot booked, so the capacity never came back and the row claimed a
    // reservation its own status contradicted (found in QA 2026-07-29).
    //
    // `availableSlots: null` means "capacity unspecified" — incrementing that
    // is meaningless (and in MySQL just yields NULL), so only counted rows are
    // touched.
    if (previous?.slotReserved) {
      const ops: Prisma.PrismaPromise<unknown>[] = [
        prisma.interest.update({ where: { id: saved.id }, data: { slotReserved: false } }),
      ];
      if (previous.tierId != null) {
        const previousTier = await prisma.sponsorshipTier.findUnique({
          where: { id: previous.tierId },
          select: { availableSlots: true },
        });
        if (previousTier?.availableSlots != null) {
          ops.unshift(
            prisma.sponsorshipTier.update({
              where: { id: previous.tierId },
              data: { availableSlots: { increment: 1 } },
            }),
          );
        }
      } else if (previous.placementId != null) {
        const previousPlacement = await prisma.placement.findUnique({
          where: { id: previous.placementId },
          select: { availableSlots: true },
        });
        if (previousPlacement?.availableSlots != null) {
          ops.unshift(
            prisma.placement.update({
              where: { id: previous.placementId },
              data: { availableSlots: { increment: 1 } },
            }),
          );
        }
      }
      await prisma.$transaction(ops);
    }
  } catch {
    return { ok: false, error: t("account.brand.expressInterestError") };
  }

  // Notification is best-effort — the application is already saved, so a DB
  // hiccup here must not 500 the request or fail the submit.
  //
  // Staff only, as of 2026-08-07. The project's owner used to get an in-app
  // row, a web push and an e-mail here; with the negotiation run entirely by
  // staff, notifying the creator would announce a lead they have no way to
  // answer. Moderators joined superadmins because they are the ones who can
  // now accept or decline (see respondToInterest).
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { title: true },
    });
    if (project) {
      await notifyRoles(["SUPERADMIN", "MODERATOR"], {
        type: "INTEREST" as const,
        data: { projectId, projectTitle: project.title, brandName: user.name },
        link: "/admin/interests",
      });
      // …and by e-mail (stage S1). The bell and the push only reach whoever
      // has the panel open; a lead that lands overnight has to survive until
      // morning. Named in the default locale — the letter is tri-lingual and
      // has no reader locale of its own, same call as respondToInterest makes.
      const [tier, placement] = await Promise.all([
        resolvedTierId
          ? prisma.sponsorshipTier.findUnique({
              where: { id: resolvedTierId },
              select: OFFER_NAME_SELECT.tier,
            })
          : null,
        resolvedPlacementId
          ? prisma.placement.findUnique({
              where: { id: resolvedPlacementId },
              select: OFFER_NAME_SELECT.placement,
            })
          : null,
      ]);
      await notifyNewInterestToStaff({
        projectTitle: project.title,
        brandName: user.name,
        tierName: pickTierName(DEFAULT_LOCALE, tier) || undefined,
        placementName: pickPlacementTitle(DEFAULT_LOCALE, placement) || undefined,
      });
    }
  } catch {
    // best-effort notification — ignore
  }

  void interestId;
  // Re-applying frees the slot booked by the previous application, and slot
  // counts live in the cached catalog DTOs — same reasoning as
  // respondToInterest in src/lib/actions/interest-response.ts.
  updateTag("projects");
  revalidateBrandPaths();
  revalidatePath("/admin/interests");
  return { ok: true };
}

export type BrandProfileFormState = {
  error?: string;
  ok?: boolean;
  /** The normalised value actually stored, echoed back on success only
   *  (IA-35) — the form no longer resets itself after a save (IA-34), so
   *  without this the input goes on showing whatever the brand typed even
   *  though `\\example.com` was rewritten to `https://example.com` before it
   *  hit the database. */
  website?: string | null;
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

/** Update the current BRAND member's name/company/website/categories/budget.
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
  if (!canBuy(user)) return { error: t("account.brand.expressInterestError") };

  // The display name. Fixed 2026-08-05: the profile page fetched it and then
  // rendered nothing for it, so a brand could edit its company, site, phone,
  // categories and budget but not the one string every creator and admin
  // actually sees — it is the name on each application ("From" in both
  // inboxes) and the only identifier in the e-mail a creator gets. A typo made
  // at registration was permanent. Required and capped exactly as on the
  // creator's own form (updateCreatorProfile), so the two cannot disagree
  // about what a usable name is.
  const name = String(fd.get("name") || "").trim();
  if (!name) return { error: t("account.profile.nameRequired") };

  // The logo. Same containment rule as the creator's avatar: a path the brand
  // does not own is discarded rather than stored, so a crafted POST cannot
  // point the picture at another member's upload directory.
  const rawAvatar = String(fd.get("avatar") || "").trim();
  const avatar =
    rawAvatar === "" || rawAvatar.startsWith(`/uploads/members/${user.id}/`) ? rawAvatar : "";

  const company = String(fd.get("company") || "").trim().slice(0, VARCHAR_MAX);
  // Capped generously before parsing (not to VARCHAR_MAX yet) — the parsed
  // and normalised URL is what actually gets capped to the column limit,
  // below, since `new URL(...).toString()` can come out longer than what was
  // typed (a bare domain gains a scheme and a trailing slash).
  const websiteRaw = String(fd.get("website") || "").trim().slice(0, 2000);
  const websiteParsed = parseWebsiteUrl(websiteRaw);
  if (!websiteParsed.ok) return { error: t("account.brand.websiteInvalid") };
  const website = websiteParsed.value ? websiteParsed.value.slice(0, VARCHAR_MAX) : null;
  const categories = jsonArray(fd, "brandCategories").filter((c) => BRAND_CATEGORIES.includes(c));
  const budgetRangeRaw = String(fd.get("budgetRange") || "");
  const budgetRange = BUDGET_VALUES.includes(budgetRangeRaw) ? budgetRangeRaw : null;
  // The callback number, editable here since 2026-07-29. Optional in the
  // profile (an application still demands one), but a number that IS given has
  // to be a real one — the same rule the popup applies, so the two can't
  // disagree about what a valid number is.
  // The country picker seeds the field with a bare dial code ("+374"), so an
  // untouched field arrives as that rather than empty — treated as "no number
  // given", otherwise saving the company name would fail on a phone the brand
  // never typed.
  const phoneRaw = String(fd.get("phone") || "").trim().slice(0, 32);
  const phone = /^\+\d{1,4}$/.test(phoneRaw) ? "" : phoneRaw;
  if (phone && !isValidPhone(phone)) return { error: t("account.brand.applyPhoneRequired") };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: name.slice(0, 120),
      avatar: avatar || null,
      company: company || null,
      website,
      phone: phone || null,
      brandCategories: JSON.stringify(categories),
      budgetRange,
    },
  });

  revalidateBrandPaths();
  // name/avatar/phone/website are the same User columns the creator profile
  // form edits (QA-5, 2026-08-11) — same reasoning as updateCreatorProfile's
  // mirrored revalidatePath.
  revalidatePath("/account/profile");
  return { ok: true, website };
}

/** Returns a JSON dump of the brand's own profile + expressed interests
 *  (the "Download my data" button — client-side triggers a Blob download
 *  from this string, no separate API route needed). */
export async function getBrandDataExport(): Promise<string> {
  const user = await requireMember();
  if (!canBuy(user)) return JSON.stringify({ error: "forbidden" });

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
