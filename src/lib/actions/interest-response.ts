"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { loadStaffUser } from "@/lib/auth/require";
import { canHandleInterests } from "@/lib/auth/permissions";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { createNotification } from "@/lib/data/notifications";
import { notifyInterestAnswered } from "@/lib/mail";
import { OFFER_NAME_SELECT, pickPlacementTitle, pickTierName } from "@/lib/data/pick-locale";
import { DEFAULT_LOCALE } from "@/lib/i18n";

/* Wave 2 of the audit — the answer half of an application.
 *
 * MUTUAL / DECLINED existed in the enum, the brand cabinet already drew their
 * badges and the notification types were declared, but nothing in the codebase
 * ever set them (audit 2.2): every application stayed "Sent" forever and the
 * brand never heard back. This action is what sets them. It used to serve two
 * inboxes; since 2026-08-07 the only one left is the staff inbox
 * (/admin/interests).
 *
 * Accepting also takes the slot the application is for (audit 2.3): two brands
 * could each be told an exclusive placement was theirs, because availableSlots
 * was only ever edited by hand in the admin form. */

export type RespondResult = { ok: true } | { ok: false; error: string };

type Responder = { id: number; role: string };

/** The staff member answering: signed in on the staff cookie and holding a
   role that handles applications — superadmin or moderator.

   Creators used to be accepted here too, and answered in their own inbox. That
   inbox is gone as of 2026-08-07 (owner decision): the negotiation with a brand
   is run by staff end to end, so the creator is not part of this chain at all
   any more.

   This used to ask canEditContent and then re-check for SUPERADMIN/MODERATOR
   below — an intersection of one role, which locked moderators out of the very
   job they were given. One predicate now, checked once. */
async function loadResponder(): Promise<Responder | null> {
  const staff = await loadStaffUser();
  if (staff && canHandleInterests(staff.role)) return { id: staff.id, role: staff.role };
  return null;
}

/** Accept or decline a brand's application.
   `accept` → MUTUAL, otherwise DECLINED. `note` is the creator's own words and
   reaches the brand in the cabinet, the in-app notification and the email. */
export async function respondToInterest(
  interestId: number,
  accept: boolean,
  note: string,
): Promise<RespondResult> {
  const t = makeUI(await getLocale());
  const responder = await loadResponder();
  if (!responder) return { ok: false, error: t("interests.errNotAllowed") };
  if (!Number.isInteger(interestId)) return { ok: false, error: t("interests.errNotAllowed") };

  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: {
      project: { select: { id: true, title: true, ownerId: true } },
      brand: { select: { id: true, email: true, name: true } },
      tier: { select: { id: true, ...OFFER_NAME_SELECT.tier, availableSlots: true } },
      // A brand can name a product placement instead of a package (2026-07-29,
      // see the Interest model comment) — slots for those need the same
      // bookkeeping below, tier and placement being mutually exclusive on an
      // application in practice.
      placement: { select: { id: true, ...OFFER_NAME_SELECT.placement, availableSlots: true } },
    },
  });
  if (!interest) return { ok: false, error: t("interests.errNotFound") };
  // Who decides is settled by loadResponder above: superadmins and moderators
  // (owner decision 2026-08-07). Before that it was "the project's owner, or a
  // superadmin" — but with the creator out of this flow entirely, owner-only
  // left every application waiting on one person. Publishers edit content and
  // still don't decide deals.

  const status = accept ? "MUTUAL" : "DECLINED";
  const trimmedNote = note.trim().slice(0, 2000);

  // Slot bookkeeping runs in the same transaction as the status change, so an
  // accepted application can never end up holding a slot that wasn't taken (or
  // a declined one keep holding it). The application names either a package or
  // a placement, never both, so whichever one is set is the thing whose slot
  // count moves.
  const offer = interest.tier ?? interest.placement;
  const reserveSlot = accept && !interest.slotReserved && offer != null;
  const releaseSlot = !accept && interest.slotReserved && offer != null;

  if (reserveSlot && offer!.availableSlots != null && offer!.availableSlots <= 0) {
    return { ok: false, error: t("interests.errNoSlots") };
  }

  await prisma.$transaction(async (tx) => {
    await tx.interest.update({
      where: { id: interestId },
      data: {
        status,
        respondedAt: new Date(),
        responseNote: trimmedNote || null,
        slotReserved: reserveSlot ? true : releaseSlot ? false : interest.slotReserved,
      },
    });
    await tx.interestEvent.create({
      data: {
        interestId,
        // Always staff now — the creator no longer answers applications at all,
        // so the plain "RESPONSE" (the seller answered) can't happen any more.
        // The kind is kept in the enum for the history rows already written.
        kind: "RESPONSE_STAFF",
        status,
        body: trimmedNote || null,
        authorId: responder.id,
      },
    });
    // null availableSlots means "capacity not tracked" for this offer — leave
    // it alone, since incrementing/decrementing a NULL column stays NULL in
    // MySQL and would silently do nothing useful anyway.
    if (offer != null && offer.availableSlots != null && (reserveSlot || releaseSlot)) {
      const data = { availableSlots: { [reserveSlot ? "decrement" : "increment"]: 1 } };
      if (interest.tier != null) {
        await tx.sponsorshipTier.update({ where: { id: interest.tier.id }, data });
      } else if (interest.placement != null) {
        await tx.placement.update({ where: { id: interest.placement.id }, data });
      }
    }
  });

  // Telling the brand is best-effort: the decision is already recorded, and a
  // mail/notification hiccup must not undo it.
  try {
    await createNotification(interest.brand.id, {
      type: accept ? "INTEREST_APPROVED" : "INTEREST_DECLINED",
      data: {
        projectId: interest.project.id,
        projectTitle: interest.project.title,
        reason: trimmedNote || undefined,
      },
      link: "/account/brand/interests",
    });
  } catch (err) {
    console.error("[interests] failed to notify the brand:", err);
  }
  try {
    await notifyInterestAnswered(
      {
        projectId: interest.project.id,
        projectTitle: interest.project.title,
        brandName: interest.brand.name,
        // notifyInterestAnswered only knows "tierName" — reuse it for a
        // placement's title too (they're mutually exclusive on one
        // application) rather than change a signature owned by mail.ts.
        // Named in the default locale: the mail is tri-lingual in its own
        // labels and has no reader locale to resolve with.
        tierName:
          pickTierName(DEFAULT_LOCALE, interest.tier) ||
          pickPlacementTitle(DEFAULT_LOCALE, interest.placement) ||
          undefined,
        note: trimmedNote,
        accepted: accept,
      },
      interest.brand.email,
    );
  } catch (err) {
    console.error("[interests] failed to email the brand:", err);
  }

  // Accepting or declining moves availableSlots, and the slot counts are baked
  // into the cached catalog DTOs (src/lib/data/projects.ts) — without this the
  // public card kept advertising a slot that had just been taken, for up to the
  // 300s cache window.
  updateTag("projects");
  revalidatePath("/admin/interests");
  revalidatePath("/account/brand/interests");
  revalidatePath(`/reports/${interest.project.id}`);
  return { ok: true };
}
