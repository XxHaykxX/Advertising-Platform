import "server-only";
import { prisma } from "@/lib/prisma";
import type { PortfolioDTO } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

/** locale → en → base fallback chain for a per-locale content field. Returns
   the first non-empty candidate in that order. Mirrors pickLocale in
   src/lib/data/projects.ts. */
function pickLocale(
  locale: Locale,
  values: { hy?: string | null; ru?: string | null; en?: string | null },
  base: string,
): string {
  const byLocale = locale === "hy" ? values.hy : locale === "ru" ? values.ru : values.en;
  if (byLocale) return byLocale;
  if (values.en) return values.en;
  return base;
}

export async function getPortfolio(locale: Locale): Promise<PortfolioDTO[]> {
  const rows = await prisma.portfolio.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((c) => ({
    id: c.id,
    title: pickLocale(locale, { hy: c.titleHy, ru: c.titleRu, en: c.titleEn }, c.title),
    brand: c.brand,
    description: pickLocale(
      locale,
      { hy: c.descriptionHy, ru: c.descriptionRu, en: c.descriptionEn },
      c.description,
    ),
    image: c.image,
    metrics: c.metrics ?? "{}",
  }));
}
