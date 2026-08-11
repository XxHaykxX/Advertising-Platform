import "server-only";
import { prisma } from "@/lib/prisma";
import { parseStringArray } from "@/lib/data/format";
import type { Locale } from "@/lib/i18n";
import type { InterestStatus } from "@prisma/client";
import { OFFER_NAME_SELECT, pickPlacementTitle, pickTierName } from "@/lib/data/pick-locale";

/* Wave 2 of the audit — the seller's side of an application.
 *
 * A brand's Interest used to be write-only: `message` and `contact` were saved
 * and then read by nobody (the /admin/interests section had been deleted, and
 * the creator had no applications page at all), so a creator got a "brand X is
 * interested" notification with no text, no contact and no way to answer
 * (audit 2.1). This module is the read side that was missing. It served two
 * inboxes at first; since 2026-08-07 the only reader is /admin/interests —
 * see the note on the removed owner-scoped queries at the bottom of the file.
 *
 * Small, staff/owner-scoped queries: no unstable_cache, same reasoning as
 * brand-interests.ts. */

export type InterestEventDTO = {
  id: number;
  kind: string; // APPLICATION | RESPONSE
  status: InterestStatus | null;
  body: string;
  contact: string;
  createdAt: string;
};

export type InterestInboxDTO = {
  id: number;
  status: InterestStatus;
  createdAt: string;
  respondedAt: string | null;
  responseNote: string;
  message: string;
  contact: string;
  /** What the brand says it wants placed. Empty for applications sent before
   *  the field existed. The brief's other three answers — the brand's price,
   *  the deal type and the timing — left the form on 2026-08-05. */
  productInfo: string;
  brand: {
    id: number;
    name: string;
    company: string;
    email: string;
    phone: string;
    website: string;
    /** Budget bracket from the brand's own profile (BUDGET_RANGES value, e.g.
     *  "5-20M"), and the categories it advertises in. Both were already filled
     *  in by the brand and read by nobody: the seller had to decide on a
     *  package worth millions while seeing only a name and an email. */
    budgetRange: string;
    categories: string[];
  };
  project: {
    id: number;
    title: string;
    code: string;
    poster: string;
    ownerId: number;
  };
  tier: {
    id: number;
    name: string;
    priceAmd: number | null; // null -> "on request" (2026-08-04), same contract as placement.priceAmd below
    isExclusive: boolean;
    availableSlots: number | null;
    totalSlots: number | null;
  } | null;
  // Product placement the brand applied for (2026-07-29) — mutually exclusive
  // with tier above in practice (one picker over both lists). priceAmd is
  // nullable here too (2026-08-04): a creator can list a placement or a
  // package "on request".
  placement: {
    id: number;
    title: string;
    priceAmd: number | null;
    availableSlots: number | null;
    totalSlots: number | null;
  } | null;
  events: InterestEventDTO[];
};

// Locale → en → base fallback, same order as pickLocale() in
// src/lib/data/projects.ts.
function pickTitle(
  locale: Locale,
  p: { title: string; titleHy: string; titleRu: string; titleEn: string },
): string {
  const byLocale = locale === "hy" ? p.titleHy : locale === "ru" ? p.titleRu : p.titleEn;
  if (byLocale) return byLocale;
  if (p.titleEn) return p.titleEn;
  return p.title;
}

const INTEREST_INCLUDE = {
  brand: {
    select: {
      id: true,
      name: true,
      company: true,
      email: true,
      phone: true,
      website: true,
      budgetRange: true,
      brandCategories: true,
    },
  },
  project: {
    select: {
      id: true,
      code: true,
      poster: true,
      ownerId: true,
      title: true,
      titleHy: true,
      titleRu: true,
      titleEn: true,
    },
  },
  // The per-locale name columns ride along (IA-44, 2026-08-05) so an offer is
  // named in the reader's own language here too — this feeds the creator's
  // inbox and /admin/interests, not just the public page.
  tier: {
    select: {
      id: true, ...OFFER_NAME_SELECT.tier,
      priceAmd: true, isExclusive: true, availableSlots: true, totalSlots: true,
    },
  },
  placement: {
    select: {
      id: true, ...OFFER_NAME_SELECT.placement,
      priceAmd: true, availableSlots: true, totalSlots: true,
    },
  },
  events: { orderBy: { createdAt: "asc" } },
} as const;

type InterestRow = Awaited<
  ReturnType<typeof prisma.interest.findMany<{ include: typeof INTEREST_INCLUDE }>>
>[number];

function toDTO(locale: Locale, r: InterestRow): InterestInboxDTO {
  return {
    id: r.id,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    respondedAt: r.respondedAt?.toISOString() ?? null,
    responseNote: r.responseNote ?? "",
    message: r.message ?? "",
    contact: r.contact ?? "",
    productInfo: r.productInfo ?? "",
    brand: {
      id: r.brand.id,
      name: r.brand.name,
      company: r.brand.company ?? "",
      email: r.brand.email,
      phone: r.brand.phone ?? "",
      website: r.brand.website ?? "",
      budgetRange: r.brand.budgetRange ?? "",
      categories: parseStringArray(r.brand.brandCategories),
    },
    project: {
      id: r.project.id,
      title: pickTitle(locale, r.project),
      code: r.project.code,
      poster: r.project.poster ?? "",
      ownerId: r.project.ownerId,
    },
    tier: r.tier
      ? {
          id: r.tier.id,
          name: pickTierName(locale, r.tier),
          priceAmd: r.tier.priceAmd,
          isExclusive: r.tier.isExclusive,
          availableSlots: r.tier.availableSlots,
          totalSlots: r.tier.totalSlots,
        }
      : null,
    placement: r.placement
      ? {
          id: r.placement.id,
          title: pickPlacementTitle(locale, r.placement),
          priceAmd: r.placement.priceAmd,
          availableSlots: r.placement.availableSlots,
          totalSlots: r.placement.totalSlots,
        }
      : null,
    events: r.events.map((e) => ({
      id: e.id,
      kind: e.kind,
      status: e.status,
      body: e.body ?? "",
      contact: e.contact ?? "",
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

/** Every application on the platform, newest first — the admin inbox. */
export async function getAllInterests(locale: Locale): Promise<InterestInboxDTO[]> {
  const rows = await prisma.interest.findMany({
    include: INTEREST_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => toDTO(locale, r));
}

/* getInterestsForOwner / getPendingInterestCountForOwner used to live here and
   backed the creator's own inbox at /account/interests. That inbox was removed
   on 2026-08-07 (owner decision — staff run the negotiation), and with it the
   only callers. The admin panel counts pending applications with its own
   role-aware query in admin/(panel)/interests/actions.ts. */

export async function getPendingInterestCount(): Promise<number> {
  return prisma.interest.count({ where: { status: "SENT" } });
}
