"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireContentEditor } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { revalidateAdSpaces } from "@/lib/data/revalidate-ad-spaces";
import {
  adSpacePublishBlockers,
  buildAdSpaceData,
  parseAdSpaceOfferRows,
  validateAdSpace,
  type AdSpaceFormState,
} from "./form-shared";
import { adSpaceScalars, generateAdSpaceCode, saveAdSpaceOfferRows } from "./write";

/* Staff side of ad-space inventory (/admin/ad-spaces). A staff-authored space
   goes straight to APPROVED, exactly like a staff-authored project — the
   moderation queue exists for what members submit. The creator's own actions
   live in src/app/account/ad-spaces/actions.ts and force the opposite.

   Every export here is a public RPC endpoint, so each one re-runs the same
   guard the page does (requireContentEditor) rather than trusting that the
   caller came from a page it protects. */

function revalidateAdSpacePaths() {
  revalidateAdSpaces();
  revalidatePath("/admin/ad-spaces");
}

export async function createAdSpace(
  _prev: AdSpaceFormState,
  fd: FormData,
): Promise<AdSpaceFormState> {
  const user = await requireContentEditor();
  const t = makeUI(await getLocale());

  const data = buildAdSpaceData(fd);
  const error = validateAdSpace(data, t);
  if (error) return { error, values: data };

  const offers = parseAdSpaceOfferRows(fd);
  // Staff saves are APPROVED on the spot, so "public" is decided by the
  // isActive box alone — a space switched off may be as empty as its author
  // likes, a live one may not (see adSpacePublishBlockers).
  if (data.isActive) {
    const missing = adSpacePublishBlockers(data, offers.length);
    if (missing.length) {
      return { error: `${t("publish.blockedSubmit")} ${missing.map((k) => t(k)).join(", ")}.`, values: data };
    }
  }

  // Position is owned by the list, not by a field — a new space lands last.
  const max = await prisma.adSpace.aggregate({ _max: { sortOrder: true } });

  for (let attempt = 1; attempt <= 5; attempt++) {
    const code = await generateAdSpaceCode();
    try {
      await prisma.$transaction(async (tx) => {
        const created = await tx.adSpace.create({
          data: {
            ...adSpaceScalars(data),
            code,
            // ── Never trusted from the form ──
            ownerId: user.id,
            updatedById: user.id,
            moderationStatus: "APPROVED",
            isActive: data.isActive,
            sortOrder: (max._max.sortOrder ?? 0) + 1,
          },
        });
        await saveAdSpaceOfferRows(tx, created.id, offers);
      });
    } catch (e) {
      // Another save took the code between the read and the insert — generate
      // a fresh one and retry, same loop as createProject.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && attempt < 5) continue;
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return { error: t("adSpaceForm.errCode"), values: data };
      }
      throw e;
    }
    revalidateAdSpacePaths();
    return { ok: true, redirect: "/admin/ad-spaces" };
  }
  return { error: t("adSpaceForm.errCode"), values: data };
}

export async function updateAdSpace(
  id: number,
  _prev: AdSpaceFormState,
  fd: FormData,
): Promise<AdSpaceFormState> {
  const user = await requireContentEditor();
  const t = makeUI(await getLocale());

  const existing = await prisma.adSpace.findUnique({
    where: { id },
    select: { id: true, code: true, ownerId: true },
  });
  if (!existing) notFound();
  // Same scoping as the projects section: a Publisher edits their own rows,
  // SUPERADMIN edits everything.
  if (user.role !== "SUPERADMIN" && existing.ownerId !== user.id) notFound();

  const data = buildAdSpaceData(fd);
  const error = validateAdSpace(data, t);
  if (error) return { error, values: data };

  const offers = parseAdSpaceOfferRows(fd);
  if (data.isActive) {
    const missing = adSpacePublishBlockers(data, offers.length);
    if (missing.length) {
      return { error: `${t("publish.blockedSubmit")} ${missing.map((k) => t(k)).join(", ")}.`, values: data };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.adSpace.update({
      where: { id },
      data: {
        ...adSpaceScalars(data),
        // `code` reaches the form as a hidden mirror; re-assert the stored one
        // so a hand-made POST can't rename a space to any free code.
        code: existing.code,
        isActive: data.isActive,
        updatedById: user.id,
      },
    });
    await saveAdSpaceOfferRows(tx, id, offers);
  });

  revalidateAdSpacePaths();
  return { ok: true, redirect: "/admin/ad-spaces" };
}

export async function deleteAdSpace(id: number) {
  const user = await requireContentEditor();
  const existing = await prisma.adSpace.findUnique({ where: { id }, select: { ownerId: true } });
  if (!existing) return;
  if (user.role !== "SUPERADMIN" && existing.ownerId !== user.id) return;
  // Offers cascade with the row (schema onDelete: Cascade).
  await prisma.adSpace.delete({ where: { id } }).catch(() => null);
  revalidateAdSpacePaths();
}
