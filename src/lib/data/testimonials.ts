import "server-only";
import { prisma } from "@/lib/prisma";
import type { TestimonialDTO } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

/** locale → en → first non-empty. Same chain as getPortfolio, minus the legacy
   base column: Testimonial is new, so there is no pre-i18n field to fall back
   to — the last resort is whichever translation staff did fill in. */
function pickQuote(
  locale: Locale,
  values: { hy: string | null; ru: string | null; en: string | null },
): string {
  const byLocale = locale === "hy" ? values.hy : locale === "ru" ? values.ru : values.en;
  return byLocale || values.en || values.hy || values.ru || "";
}

export async function getTestimonials(locale: Locale): Promise<TestimonialDTO[]> {
  const rows = await prisma.testimonial.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    video: r.video,
    image: r.image,
    quote: pickQuote(locale, { hy: r.quoteHy, ru: r.quoteRu, en: r.quoteEn }),
    authorName: r.authorName,
    authorRole: r.authorRole,
    company: r.company,
    avatar: r.avatar,
  }));
}
