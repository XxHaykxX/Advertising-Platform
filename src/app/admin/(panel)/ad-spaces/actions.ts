"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireContentEditor, requireSuperadmin } from "@/lib/auth/require";
import { recordVersion } from "@/lib/history/record";
import { deleteUpload } from "@/lib/actions/uploads";
import { findUploadUsage } from "@/lib/uploads-usage";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { revalidateAdSpaces } from "@/lib/data/revalidate-ad-spaces";
import { addCities } from "@/lib/actions/cities";
import { canonicalCityToken } from "@/lib/cities";
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

  // #64: persist a custom city into the global dictionary so future spaces
  // offer it too — never blocks the save. Same "typed once, offered forever"
  // contract as addCountries/addStudios; only staff widens it (addCities is a
  // no-op for a creator's own action, which doesn't call it).
  try {
    await addCities([canonicalCityToken(data.city)]);
  } catch {
    /* ignore */
  }

  const offers = parseAdSpaceOfferRows(fd);
  // Staff saves are APPROVED on the spot, so "public" is decided by the
  // isActive box alone — a space switched off may be as empty as its author
  // likes, a live one may not (see adSpacePublishBlockers).
  if (data.isActive) {
    const missing = adSpacePublishBlockers(data, offers.length);
    if (missing.length) {
      return { error: `${t("adSpace.publish.blockedSubmit")} ${missing.map((k) => t(k)).join(", ")}.`, values: data };
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
        await recordVersion(tx, "AdSpace", created.id, "CREATE", { id: user.id, name: user.name });
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

  // #64: see the same call in createAdSpace.
  try {
    await addCities([canonicalCityToken(data.city)]);
  } catch {
    /* ignore */
  }

  const offers = parseAdSpaceOfferRows(fd);
  if (data.isActive) {
    const missing = adSpacePublishBlockers(data, offers.length);
    if (missing.length) {
      return { error: `${t("adSpace.publish.blockedSubmit")} ${missing.map((k) => t(k)).join(", ")}.`, values: data };
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
    await recordVersion(tx, "AdSpace", id, "UPDATE", { id: user.id, name: user.name });
  });

  revalidateAdSpacePaths();
  return { ok: true, redirect: "/admin/ad-spaces" };
}

export async function deleteAdSpace(id: number) {
  const user = await requireContentEditor();
  const existing = await prisma.adSpace.findUnique({
    where: { id },
    // Pull the images too, so the files go with the row instead of being
    // orphaned on disk — same contract as deleteProject.
    select: { ownerId: true, image: true, gallery: true },
  });
  if (!existing) return;
  if (user.role !== "SUPERADMIN" && existing.ownerId !== user.id) return;

  const imagePaths = collectAdSpaceImagePaths(existing);
  // BEFORE the delete — a DELETE version is a snapshot of what is about to
  // stop existing, and it is what /admin/history/deleted restores from.
  await recordVersion(prisma, "AdSpace", id, "DELETE", { id: user.id, name: user.name });
  // Offers cascade with the row (schema onDelete: Cascade).
  await prisma.adSpace.delete({ where: { id } }).catch(() => null);

  for (const p of imagePaths) {
    try {
      // A DELETE version (if history recorded one) always mentions these paths,
      // so a plain deleteUpload(p) would see *history* usage for a space that
      // no longer exists and refuse to touch the file. Check `current` — after
      // the delete only some OTHER live record can still show up there, an ad
      // space or anything else — and force past the irrelevant history hit.
      const usage = await findUploadUsage(p);
      if (usage.current.length === 0) {
        await deleteUpload(p, { force: true });
      }
    } catch {
      // best-effort file cleanup — never let a stray unlink error block delete
    }
  }

  revalidateAdSpacePaths();
}

/** Every /uploads/… image a space owns: the main photo and the gallery.
 *  External URLs (not /uploads/…) are left untouched. */
function collectAdSpaceImagePaths(s: { image: string | null; gallery: string | null }): string[] {
  const out: string[] = [];
  if (s.image) out.push(s.image);
  if (s.gallery) {
    try {
      const arr = JSON.parse(s.gallery);
      if (Array.isArray(arr)) out.push(...arr.filter((x): x is string => typeof x === "string"));
    } catch {
      // malformed gallery JSON — nothing to clean up
    }
  }
  return [...new Set(out)].filter((x) => x.startsWith("/uploads/"));
}

/** Persist the whole list order in one go — the same shape (and the same
 *  by-id update, never delete+create) as reorderPortfolio.
 *
 *  SUPERADMIN only, unlike the rest of this file: a Publisher's list is
 *  filtered to its own rows, so writing 0…n-1 over that subset would renumber
 *  it on top of everybody else's positions. The list disables its drag handles
 *  for that case — this is the same rule restated where it is enforced. */
export async function reorderAdSpaces(orderedIds: number[]) {
  await requireSuperadmin();
  if (orderedIds.length === 0) return;
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.adSpace.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
  revalidateAdSpacePaths();
}
