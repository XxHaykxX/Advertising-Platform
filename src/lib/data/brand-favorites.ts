import "server-only";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/i18n";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { getRates } from "@/lib/currency/rates";

/* #22 — Favorite is a BRAND member's private shortlist heart on a project
 * card (separate from Interest — admins never see it). Same
 * "owner-scoped, low-traffic" reasoning as brand-interests.ts for skipping
 * unstable_cache. */

export type BrandFavoriteDTO = {
  id: number;
  createdAt: string;
  project: {
    id: number;
    code: string;
    title: string;
    genre: string;
    poster: string;
    format: string;
    // ── #4.7 comparison-table fields — not needed by the plain list, only
    // by favorites/page.tsx's compare table, but simplest to compute once
    // here alongside everything else this file already fetches. ──
    priceFromAmd: number | null; // cheapest tier's raw AMD price; null = no tiers yet
    priceFromDisplay: string; // preformatted in the visitor's currency; "" when priceFromAmd is null
    slotsAvailable: number;
    slotsTotal: number; // 0 => no tier has a total set, i.e. hide the slots column value
    applicationDeadline: string | null;
    status: string;
  };
};

// Locale → en → base fallback, same order as pickLocale() in
// src/lib/data/projects.ts — deliberately duplicated (small, different trust
// zone) rather than importing a non-exported helper from that module.
function pickTitle(
  locale: Locale,
  p: { title: string; titleHy: string; titleRu: string; titleEn: string },
): string {
  const byLocale = locale === "hy" ? p.titleHy : locale === "ru" ? p.titleRu : p.titleEn;
  if (byLocale) return byLocale;
  if (p.titleEn) return p.titleEn;
  return p.title;
}

export async function getBrandFavorites(
  brandId: number,
  locale: Locale,
  currency: CurrencyCode,
): Promise<BrandFavoriteDTO[]> {
  const rows = await prisma.favorite.findMany({
    where: { brandId },
    include: { project: { include: { tiers: { select: { priceAmd: true, availableSlots: true, totalSlots: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  const rates = await getRates();

  return rows.map((r) => {
    const tiers = r.project.tiers;
    const priceFromAmd = tiers.length === 0 ? null : Math.min(...tiers.map((t) => t.priceAmd));
    return {
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      project: {
        id: r.project.id,
        code: r.project.code,
        title: pickTitle(locale, r.project),
        genre: r.project.genre,
        poster: r.project.poster ?? "",
        format: r.project.format,
        priceFromAmd,
        priceFromDisplay: priceFromAmd != null ? formatMoney(priceFromAmd, currency, rates, locale) : "",
        slotsAvailable: tiers.reduce((sum, t) => sum + (t.availableSlots ?? 0), 0),
        slotsTotal: tiers.reduce((sum, t) => sum + (t.totalSlots ?? 0), 0),
        applicationDeadline: r.project.applicationDeadline?.toISOString() ?? null,
        status: r.project.status,
      },
    };
  });
}
