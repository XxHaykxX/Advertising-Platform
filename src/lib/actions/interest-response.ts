"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { canEditContent } from "@/lib/auth/permissions";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { createNotification } from "@/lib/data/notifications";
import { notifyInterestAnswered } from "@/lib/mail";

/* Wave 2 of the audit — the answer half of an application.
 *
 * MUTUAL / DECLINED existed in the enum, the brand cabinet already drew their
 * badges and the notification types were declared, but nothing in the codebase
 * ever set them (audit 2.2): every application stayed "Sent" forever and the
 * brand never heard back. This action is what sets them, and it is shared by
 * both places an answer can be given — the creator's own inbox
 * (/account/interests) and the staff inbox (/admin/interests).
 *
 * Accepting also takes the slot the application is for (audit 2.3): two brands
 * could each be told an exclusive placement was theirs, because availableSlots
 * was only ever edited by hand in the admin form. */

export type RespondResult = { ok: true } | { ok: false; error: string };

type Responder = { id: number; role: string };

/** The signed-in user, whichever cabinet they came from — a creator answering
   in their own inbox, or a staff member who owns the project themselves.
   Members must still be APPROVED and active; staff must hold a content-editing
   role. Ownership is checked separately by the caller: since 2026-07-26 only
   the project's owner may answer an application (owner decision — the deal is
   the seller's to run), so passing this check is necessary but not sufficient. */
async function loadResponder(): Promise<Responder | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, role: true, isActive: true, status: true },
  });
  if (!user || !user.isActive) return null;
  if (user.role === "CREATOR") {
    if (user.status !== "APPROVED") return null;
    return { id: user.id, role: user.role };
  }
  if (canEditContent(user.role)) return { id: user.id, role: user.role };
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
      tier: { select: { id: true, name: true, availableSlots: true } },
    },
  });
  if (!interest) return { ok: false, error: t("interests.errNotFound") };
  // The seller answers their own applications. A superadmin may answer any of
  // them: they own the marketplace, and without this nobody could answer at
  // all once projects belong to creators — an application from a brand would
  // sit unanswered forever if the creator went quiet. Publishers and
  // moderators still can't decide someone else's deal.
  const isOwner = interest.project.ownerId === responder.id;
  const isSuperadmin = responder.role === "SUPERADMIN";
  if (!isOwner && !isSuperadmin) {
    return { ok: false, error: t("interests.errOwnerOnly") };
  }

  const status = accept ? "MUTUAL" : "DECLINED";
  const trimmedNote = note.trim().slice(0, 2000);

  // Slot bookkeeping runs in the same transaction as the status change, so an
  // accepted application can never end up holding a slot that wasn't taken (or
  // a declined one keep holding it).
  const reserveSlot = accept && !interest.slotReserved && interest.tier != null;
  const releaseSlot = !accept && interest.slotReserved && interest.tier != null;

  if (reserveSlot && interest.tier!.availableSlots != null && interest.tier!.availableSlots <= 0) {
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
        // A superadmin answering for the seller is recorded as such, so the
        // history says who actually made the call.
        kind: isOwner ? "RESPONSE" : "RESPONSE_STAFF",
        status,
        body: trimmedNote || null,
        authorId: responder.id,
      },
    });
    if (reserveSlot && interest.tier!.availableSlots != null) {
      await tx.sponsorshipTier.update({
        where: { id: interest.tier!.id },
        data: { availableSlots: { decrement: 1 } },
      });
    }
    if (releaseSlot && interest.tier!.availableSlots != null) {
      await tx.sponsorshipTier.update({
        where: { id: interest.tier!.id },
        data: { availableSlots: { increment: 1 } },
      });
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
        tierName: interest.tier?.name,
        note: trimmedNote,
        accepted: accept,
      },
      interest.brand.email,
    );
  } catch (err) {
    console.error("[interests] failed to email the brand:", err);
  }

  revalidatePath("/admin/interests");
  revalidatePath("/account/interests");
  revalidatePath("/account/brand/interests");
  revalidatePath(`/reports/${interest.project.id}`);
  return { ok: true };
}
