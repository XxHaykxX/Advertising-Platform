import "server-only";
import { prisma } from "@/lib/prisma";
import type { PortfolioDTO, PortfolioMediaDTO } from "@/lib/types";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { parseStringArray, youTubeId } from "@/lib/data/format";

function L(ru: string, en: string, hy: string, locale: Locale): string {
  const v = locale === "en" ? en : locale === "hy" ? hy : ru;
  return (v || "").trim() || ru;
}

export async function getPortfolioCases(
  locale: Locale = DEFAULT_LOCALE,
): Promise<PortfolioDTO[]> {
  const rows = await prisma.portfolio.findMany({
    orderBy: { sortOrder: "asc" },
    include: { publisher: true },
  });
  return rows.map((row) => {
    const title = L(row.titleRu, row.titleEn, row.titleHy, locale);
    const [brand, film] = title.split("×").map((s) => s.trim());
    const images = parseStringArray(row.images);
    const media: PortfolioMediaDTO[] = images.map((src) => ({
      type: "image",
      src,
    }));
    if (row.videoType === "youtube" && row.videoUrl) {
      const id = youTubeId(row.videoUrl);
      if (id) media.push({ type: "youtube", id, poster: images[0] ?? "" });
    }
    return {
      id: row.id,
      brand: brand || title,
      film: film || "",
      description: L(row.descriptionRu, row.descriptionEn, row.descriptionHy, locale),
      cover: images[0] ?? "",
      media,
      publisherName: row.publisher?.name ?? null,
    };
  });
}
