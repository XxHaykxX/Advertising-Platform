import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { AdSpaceDetailDTO, AdSpaceListDTO, AdSpaceOfferDTO } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { getRates } from "@/lib/currency/rates";
import { formatPriceFrom } from "@/lib/data/format";
import { parseJsonList, pickLocale, pickLocaleList } from "@/lib/data/pick-locale";

/* Read side of AdSpace — advertising inventory that lives outside a film
   (stage 3 of docs/plan-multichannel-ads.md). Deliberately the same shape as
   src/lib/data/projects.ts: cached with the same tag family, prices already
   formatted in the visitor's currency on the server, per-locale columns
   resolved through pickLocale. The channel pages hand these straight to a
   card, exactly as /catalog does with ProjectListDTO.

   Tagged "ad-spaces" rather than "projects" so approving a billboard doesn't
   throw away the whole catalog's cache, and vice versa. */

const REVALIDATE_SECONDS = 300;

/** Everything the list DTO needs, and nothing more — the detail query selects
 *  this plus the heavy columns. */
const LIST_SELECT = {
  id: true,
  code: true,
  channel: true,
  title: true,
  titleHy: true,
  titleRu: true,
  titleEn: true,
  city: true,
  address: true,
  sizeFormat: true,
  reachPerDay: true,
  image: true,
  offers: { select: { priceAmd: true } },
} as const;

type ListRow = {
  id: number;
  code: string;
  channel: string;
  title: string;
  titleHy: string;
  titleRu: string;
  titleEn: string;
  city: string;
  address: string;
  sizeFormat: string;
  reachPerDay: number | null;
  image: string | null;
  offers: { priceAmd: number | null }[];
};

/** City and street joined for one line on the card. Either half may be empty —
 *  a radio slot has no address at all — so this never leaves a dangling comma. */
function joinLocation(city: string, address: string): string {
  return [city, address].filter(Boolean).join(", ");
}

function toListDTO(
  locale: Locale,
  currency: CurrencyCode,
  rates: Awaited<ReturnType<typeof getRates>>,
  row: ListRow,
): AdSpaceListDTO {
  return {
    id: row.id,
    code: row.code,
    channel: row.channel,
    title: pickLocale(locale, { hy: row.titleHy, ru: row.titleRu, en: row.titleEn }, row.title),
    location: joinLocation(row.city, row.address),
    sizeFormat: row.sizeFormat,
    reachPerDay: row.reachPerDay,
    image: row.image ?? "",
    priceFromDisplay: formatPriceFrom(
      row.offers.map((o) => o.priceAmd),
      currency,
      rates,
      locale,
    ),
    offersCount: row.offers.length,
  };
}

const getAdSpacesByChannelCached = unstable_cache(
  async (
    channel: string,
    locale: Locale,
    currency: CurrencyCode,
    activeOnly: boolean,
  ): Promise<AdSpaceListDTO[]> => {
    // Same gate as the project catalog: the public showcase only ever shows
    // inventory that cleared moderation. Admin call sites pass activeOnly=false
    // and see every status. Note the default here is DRAFT, not APPROVED — an
    // ad space is created by its owner, so unlike the pre-existing projects
    // there is no legacy row that must stay visible without review.
    const rows = await prisma.adSpace.findMany({
      where: activeOnly
        ? { channel, isActive: true, moderationStatus: "APPROVED" }
        : { channel },
      orderBy: { sortOrder: "asc" },
      select: LIST_SELECT,
    });
    const rates = await getRates();
    return rows.map((row) => toListDTO(locale, currency, rates, row));
  },
  ["ad-spaces-by-channel"],
  { revalidate: REVALIDATE_SECONDS, tags: ["ad-spaces"] },
);

export function getAdSpacesByChannel(
  channel: string,
  locale: Locale,
  currency: CurrencyCode,
  activeOnly = true,
): Promise<AdSpaceListDTO[]> {
  return getAdSpacesByChannelCached(channel, locale, currency, activeOnly);
}

const getAdSpaceCached = unstable_cache(
  async (
    code: string,
    locale: Locale,
    currency: CurrencyCode,
  ): Promise<AdSpaceDetailDTO | null> => {
    const row = await prisma.adSpace.findUnique({
      where: { code },
      include: { offers: { orderBy: { sortOrder: "asc" } } },
    });
    if (!row) return null;
    const rates = await getRates();
    const publiclyVisible = row.isActive && row.moderationStatus === "APPROVED";

    const offers: AdSpaceOfferDTO[] = row.offers.map((o) => ({
      id: o.id,
      name: pickLocale(locale, { hy: o.nameHy, ru: o.nameRu, en: o.nameEn }, o.name),
      period: pickLocale(locale, { hy: o.periodHy, ru: o.periodRu, en: o.periodEn }, ""),
      priceAmd: o.priceAmd,
      priceDisplay: o.priceAmd != null ? formatMoney(o.priceAmd, currency, rates, locale) : null,
      // The deal currency, for the application popup — see TierDTO.priceNative.
      priceNative: o.priceAmd != null ? formatMoney(o.priceAmd, "AMD", rates, locale) : null,
      availableSlots: o.availableSlots,
      totalSlots: o.totalSlots,
    }));

    return {
      ...toListDTO(locale, currency, rates, row),
      publiclyVisible,
      description: pickLocaleList(
        locale,
        { hy: row.descriptionHy, ru: row.descriptionRu, en: row.descriptionEn },
        row.description,
      ),
      gallery: parseJsonList(row.gallery),
      sides: row.sides,
      availableFrom: row.availableFrom?.toISOString() ?? null,
      availableTo: row.availableTo?.toISOString() ?? null,
      offers,
    };
  },
  ["ad-space-detail"],
  { revalidate: REVALIDATE_SECONDS, tags: ["ad-spaces"] },
);

/**
 * One ad space by its public code.
 *
 * The public card must not render a space that was never approved, even by
 * direct link — unlike a project report page, whose link is deliberately
 * shareable after the project archives. `activeOnly=false` is for the admin
 * preview and the owner's own cabinet, which must see a DRAFT.
 *
 * ⚠️ The approval flag is read from the CACHED row, so every write that
 * approves, rejects, hides or edits a space MUST call `updateTag("ad-spaces")`
 * — not `revalidateTag`, which still serves the stale entry (burned on
 * 2026-07-30). Without it an approved space stays invisible for up to
 * REVALIDATE_SECONDS. Re-reading the flag per request instead would cost a DB
 * round-trip on every public card view, which is exactly what the cache exists
 * to avoid on this host.
 */
export async function getAdSpace(
  code: string,
  locale: Locale,
  currency: CurrencyCode,
  activeOnly = true,
): Promise<AdSpaceDetailDTO | null> {
  const row = await getAdSpaceCached(code, locale, currency);
  if (!row) return null;
  return !activeOnly || row.publiclyVisible ? row : null;
}
