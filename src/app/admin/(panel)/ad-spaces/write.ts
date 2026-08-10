import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AD_SPACE_CHANNELS } from "@/lib/ad-channels";
import { makeUI, type Locale } from "@/lib/i18n";
import {
  formatDateInput,
  parseBenefitsInput,
  parseGalleryInput,
} from "@/app/admin/(panel)/projects/form-shared";
import {
  adSpaceLegacyOfferName,
  adSpaceLegacyTitle,
  bulletsToJson,
  dateOrNull,
  galleryToJson,
  nextAdSpaceCode,
  type AdSpaceFormValues,
  type AdSpaceOfferRow,
} from "./form-shared";

/* The database side of saving an ad space, shared by the staff action and the
   creator action. A plain server module rather than a second "use server"
   file: everything exported from one of those is a public RPC endpoint, and
   these are helpers, not endpoints.

   What is NOT here: ownerId, moderationStatus, isActive, rejectionReason and
   the code on update. Those are exactly the fields the two zones must decide
   differently, so each action sets them itself and neither can inherit the
   other's answer by accident. */

/** Everything an AdSpace row takes from the form, and nothing the form is not
 *  allowed to decide. */
export function adSpaceScalars(data: AdSpaceFormValues) {
  return {
    channel: data.channel,
    // Legacy base column — the ultimate fallback for a reader in a locale the
    // editor never filled (see pickLocale).
    title: adSpaceLegacyTitle(data),
    titleHy: data.titleHy,
    titleRu: data.titleRu,
    titleEn: data.titleEn,
    description: bulletsToJson(data.descriptionHy || data.descriptionRu || data.descriptionEn),
    // Nullable @db.Text: MySQL forbids literal defaults there, so an untouched
    // locale is null rather than "[]".
    descriptionHy: data.descriptionHy.trim() ? bulletsToJson(data.descriptionHy) : null,
    descriptionRu: data.descriptionRu.trim() ? bulletsToJson(data.descriptionRu) : null,
    descriptionEn: data.descriptionEn.trim() ? bulletsToJson(data.descriptionEn) : null,
    city: data.city,
    address: data.address,
    sizeFormat: data.sizeFormat,
    reachPerDay: data.reachPerDay,
    sides: data.sides,
    availableFrom: dateOrNull(data.availableFrom),
    availableTo: dateOrNull(data.availableTo),
    image: data.image || null,
    gallery: galleryToJson(data.gallery),
  };
}

/** The seven channels an ad space can belong to, already named in the reader's
 *  language — the form takes them as a prop rather than translating a
 *  `adChannel.${code}` key itself (see AdSpaceChannelOption). */
export function adSpaceChannelOptions(locale: Locale): { code: string; label: string }[] {
  const t = makeUI(locale);
  return AD_SPACE_CHANNELS.map((c) => ({ code: c.code, label: t(`adChannel.${c.code}`) }));
}

/** The stored row, turned back into what the form edits: bullet lists become
 *  newline text, dates become "YYYY-MM-DD", nulls become "". Structurally
 *  typed so both edit pages (staff and creator) can hand it their own query
 *  result. */
export function toAdSpaceFormInitial(row: {
  code: string;
  channel: string;
  titleHy: string;
  titleRu: string;
  titleEn: string;
  descriptionHy: string | null;
  descriptionRu: string | null;
  descriptionEn: string | null;
  description: string;
  city: string;
  address: string;
  sizeFormat: string;
  reachPerDay: number | null;
  sides: number | null;
  availableFrom: Date | null;
  availableTo: Date | null;
  image: string | null;
  gallery: string | null;
  isActive: boolean;
}): AdSpaceFormValues {
  return {
    code: row.code,
    channel: row.channel,
    titleHy: row.titleHy,
    titleRu: row.titleRu,
    titleEn: row.titleEn,
    // A row written before the locale tabs existed has only the legacy column;
    // showing it on the hy tab is what makes it editable at all.
    descriptionHy: parseBenefitsInput(row.descriptionHy ?? (row.descriptionRu || row.descriptionEn ? null : row.description)),
    descriptionRu: parseBenefitsInput(row.descriptionRu),
    descriptionEn: parseBenefitsInput(row.descriptionEn),
    city: row.city,
    address: row.address,
    sizeFormat: row.sizeFormat,
    reachPerDay: row.reachPerDay,
    sides: row.sides,
    availableFrom: formatDateInput(row.availableFrom),
    availableTo: formatDateInput(row.availableTo),
    image: row.image ?? "",
    gallery: parseGalleryInput(row.gallery),
    isActive: row.isActive,
  };
}

/** The stored offer rows, in the form's own row shape. */
export function toAdSpaceOfferRows(
  offers: {
    id: number;
    nameHy: string;
    nameRu: string;
    nameEn: string;
    periodHy: string;
    periodRu: string;
    periodEn: string;
    priceAmd: number | null;
    availableSlots: number | null;
    totalSlots: number | null;
  }[],
): AdSpaceOfferRow[] {
  return offers.map((o) => ({
    dbId: o.id,
    nameHy: o.nameHy,
    nameRu: o.nameRu,
    nameEn: o.nameEn,
    periodHy: o.periodHy,
    periodRu: o.periodRu,
    periodEn: o.periodEn,
    priceAmd: o.priceAmd,
    availableSlots: o.availableSlots,
    totalSlots: o.totalSlots,
  }));
}

export async function generateAdSpaceCode(): Promise<string> {
  const year = new Date().getFullYear();
  const rows = await prisma.adSpace.findMany({
    where: { code: { startsWith: `#AS-${year}-` } },
    select: { code: true },
  });
  return nextAdSpaceCode(rows.map((r) => r.code), year);
}

/** Persist an ad space's offer rows inside an open transaction.
 *
 *  Update-in-place by id, never delete-all-then-insert: an offer is what a
 *  brand's application will point at (stage 4 of the plan) and it holds the
 *  slot bookkeeping, so wiping and re-inserting would detach every application
 *  and reset the counts — the exact shortcut that had to be undone on the
 *  sponsorship tiers. */
export async function saveAdSpaceOfferRows(
  tx: Prisma.TransactionClient,
  adSpaceId: number,
  rows: AdSpaceOfferRow[],
) {
  const keptIds = rows.map((r) => r.dbId).filter((id): id is number => id != null);
  await tx.adSpaceOffer.deleteMany({
    where: { adSpaceId, ...(keptIds.length ? { id: { notIn: keptIds } } : {}) },
  });
  for (const [i, row] of rows.entries()) {
    const { dbId, ...rest } = row;
    const data = { ...rest, name: adSpaceLegacyOfferName(row), sortOrder: i };
    if (dbId != null) {
      // Scoped by adSpaceId too — a crafted payload must not reach another
      // space's offer.
      await tx.adSpaceOffer.updateMany({ where: { id: dbId, adSpaceId }, data });
    } else {
      await tx.adSpaceOffer.create({ data: { ...data, adSpaceId } });
    }
  }
}
