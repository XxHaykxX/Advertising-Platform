import "server-only";
import { prisma } from "@/lib/prisma";
import { parseStringArray } from "@/lib/data/format";
import type { Locale } from "@/lib/i18n";
import type { InterestStatus } from "@prisma/client";

/* Wave 2 of the audit — the seller's side of an application.
 *
 * A brand's Interest used to be write-only: `message` and `contact` were saved
 * and then read by nobody (the /admin/interests section had been deleted, and
 * the creator had no applications page at all), so a creator got a "brand X is
 * interested" notification with no text, no contact and no way to answer
 * (audit 2.1). This module is the read side that was missing — used by both
 * /admin/interests (all applications) and /account/interests (a creator's own).
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
  /** The brief the brand filled in (2026-07-26): what is being placed, when,
   *  and whether the offer is cash, barter or both. Empty for applications
   *  sent before the fields existed. */
  productInfo: string;
  desiredTiming: string;
  dealType: string;
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
    priceAmd: number;
    isExclusive: boolean;
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
  tier: { select: { id: true, name: true, priceAmd: true, isExclusive: true, availableSlots: true, totalSlots: true } },
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
    desiredTiming: r.desiredTiming ?? "",
    dealType: r.dealType ?? "",
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
          name: r.tier.name,
          priceAmd: r.tier.priceAmd,
          isExclusive: r.tier.isExclusive,
          availableSlots: r.tier.availableSlots,
          totalSlots: r.tier.totalSlots,
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

/** Applications on projects owned by `ownerId` — the creator's own inbox. */
export async function getInterestsForOwner(ownerId: number, locale: Locale): Promise<InterestInboxDTO[]> {
  const rows = await prisma.interest.findMany({
    where: { project: { ownerId } },
    include: INTEREST_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => toDTO(locale, r));
}

/** Applications still awaiting an answer — drives the sidebar/nav badges. */
export async function getPendingInterestCountForOwner(ownerId: number): Promise<number> {
  return prisma.interest.count({ where: { status: "SENT", project: { ownerId } } });
}

export async function getPendingInterestCount(): Promise<number> {
  return prisma.interest.count({ where: { status: "SENT" } });
}
