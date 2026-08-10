"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { notifyRoles } from "@/lib/data/notifications";
import { revalidateAdSpaces } from "@/lib/data/revalidate-ad-spaces";
import {
  adSpaceLegacyTitle,
  adSpacePublishBlockers,
  buildAdSpaceData,
  parseAdSpaceOfferRows,
  validateAdSpace,
  type AdSpaceFormState,
} from "@/app/admin/(panel)/ad-spaces/form-shared";
import {
  adSpaceScalars,
  generateAdSpaceCode,
  saveAdSpaceOfferRows,
} from "@/app/admin/(panel)/ad-spaces/write";

/* Creator side of ad-space inventory (/account/ad-spaces).

   The form, the parsing and the offer writer are shared with the staff
   section; what is NOT shared is who owns the row and who decides its status.
   A creator's save always lands PENDING + inactive and goes to the same
   moderation queue as a submitted project — ownerId, moderationStatus and
   isActive are forced here and must never be reachable from the form. */

async function guardCreator() {
  const user = await requireMember();
  const locale = await getLocale();
  const t = makeUI(locale);
  // Defense in depth: the cabinet entry points are hidden from BRAND accounts,
  // but a direct POST has to be refused rather than quietly create a space
  // owned by a brand.
  return { user, t, isCreator: user.role === "CREATOR" };
}

/** Submitting IS this side's publication step — there is no creator-owned
 *  draft — so the same list that gates a public space is checked here. One
 *  predicate, shared with the staff save and the moderator's approval. */
function submitGate(
  data: ReturnType<typeof buildAdSpaceData>,
  offersCount: number,
  t: ReturnType<typeof makeUI>,
): string | null {
  const missing = adSpacePublishBlockers(data, offersCount);
  if (!missing.length) return null;
  return `${t("publish.blockedSubmit")} ${missing.map((k) => t(k)).join(", ")}.`;
}

async function notifyModerators(adSpaceId: number, title: string, creatorName: string) {
  await notifyRoles(["SUPERADMIN", "MODERATOR"], {
    type: "ADSPACE_SUBMITTED",
    data: { adSpaceId, adSpaceTitle: title, creatorName },
    link: "/admin/moderation",
  });
}

export async function createCreatorAdSpace(
  _prev: AdSpaceFormState,
  fd: FormData,
): Promise<AdSpaceFormState> {
  const { user, t, isCreator } = await guardCreator();
  if (!isCreator) return { error: t("account.form.errRequired") };

  const data = buildAdSpaceData(fd);
  const error = validateAdSpace(data, t);
  if (error) return { error, values: data };

  const offers = parseAdSpaceOfferRows(fd);
  const blocked = submitGate(data, offers.length, t);
  if (blocked) return { error: blocked, values: data };

  const max = await prisma.adSpace.aggregate({ _max: { sortOrder: true } });

  for (let attempt = 1; attempt <= 5; attempt++) {
    const code = await generateAdSpaceCode();
    try {
      const created = await prisma.$transaction(async (tx) => {
        const space = await tx.adSpace.create({
          data: {
            ...adSpaceScalars(data),
            code,
            // ── Never trusted from the form — forced server-side ──
            ownerId: user.id,
            updatedById: user.id,
            moderationStatus: "PENDING",
            isActive: false,
            sortOrder: (max._max.sortOrder ?? 0) + 1,
          },
        });
        await saveAdSpaceOfferRows(tx, space.id, offers);
        return space;
      });
      await notifyModerators(created.id, created.title, user.name);
      revalidateAdSpaces();
      revalidatePath("/account/ad-spaces");
      revalidatePath("/admin/moderation");
      return { ok: true, redirect: "/account/ad-spaces" };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && attempt < 5) continue;
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return { error: t("adSpaceForm.errCode"), values: data };
      }
      throw e;
    }
  }
  return { error: t("adSpaceForm.errCode"), values: data };
}

/** Edit a creator's OWN ad space. Any save re-enters moderation — that is what
 *  makes a resubmission a resubmission. An APPROVED space is refused: it is
 *  live, brands are reading it, and an edit would pull it back out until
 *  somebody re-checked it (same owner decision as projects, 2026-08-07). */
export async function updateCreatorAdSpace(
  id: number,
  _prev: AdSpaceFormState,
  fd: FormData,
): Promise<AdSpaceFormState> {
  const { user, t, isCreator } = await guardCreator();
  if (!isCreator) return { error: t("account.form.errRequired") };

  // 404 for both "doesn't exist" and "not yours" — a creator must not be able
  // to tell the two apart.
  const existing = await prisma.adSpace.findUnique({
    where: { id },
    select: { ownerId: true, code: true, moderationStatus: true },
  });
  if (!existing) notFound();
  if (existing.ownerId !== user.id) notFound();
  if (existing.moderationStatus === "APPROVED") return { error: t("account.form.errApproved") };

  const data = buildAdSpaceData(fd);
  const error = validateAdSpace(data, t);
  if (error) return { error, values: data };

  const offers = parseAdSpaceOfferRows(fd);
  const blocked = submitGate(data, offers.length, t);
  if (blocked) return { error: blocked, values: data };

  await prisma.$transaction(async (tx) => {
    await tx.adSpace.update({
      where: { id },
      data: {
        ...adSpaceScalars(data),
        // The public identifier is the stored one, whatever the hidden mirror
        // in the form came back with.
        code: existing.code,
        // Back to moderation on every save; a stale rejection no longer
        // applies to what was just rewritten.
        moderationStatus: "PENDING",
        isActive: false,
        rejectionReason: null,
        updatedById: user.id,
      },
    });
    await saveAdSpaceOfferRows(tx, id, offers);
  });

  await notifyModerators(id, adSpaceLegacyTitle(data), user.name);
  revalidateAdSpaces();
  revalidatePath("/account/ad-spaces");
  revalidatePath("/admin/moderation");
  return { ok: true, redirect: "/account/ad-spaces" };
}
