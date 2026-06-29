import type { Metadata } from "next";
import { Portfolio } from "@/components/sections/portfolio";
import { getPortfolioCases } from "@/lib/data/portfolio";
import { getContent } from "@/lib/data/content";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { JsonLd } from "@/components/json-ld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getContent(locale);
  return {
    title: makeUI(locale)("nav.portfolio"),
    description: t["portfolio.subtitle"],
    alternates: { canonical: "/portfolio" },
  };
}

export default async function PortfolioPage() {
  const locale = await getLocale();
  const [cases, t] = await Promise.all([
    getPortfolioCases(locale),
    getContent(locale),
  ]);

  const abs = (u: string) => (u.startsWith("http") ? u : `${SITE_URL}${u}`);
  const videos = cases.flatMap((c) =>
    c.media
      .filter((m) => m.type === "youtube")
      .map((m) => ({
        "@type": "VideoObject",
        name: `${c.brand} × ${c.film}`,
        description: c.description,
        ...(m.type === "youtube" && m.poster
          ? { thumbnailUrl: abs(m.poster) }
          : {}),
        ...(m.type === "youtube"
          ? {
              embedUrl: `https://www.youtube.com/embed/${m.id}`,
              contentUrl: `https://www.youtube.com/watch?v=${m.id}`,
            }
          : {}),
      })),
  );
  const videoLd = videos.length
    ? { "@context": "https://schema.org", "@graph": videos }
    : null;

  return (
    <main>
      {videoLd && <JsonLd data={videoLd} />}
      <Portfolio cases={cases} t={t} locale={locale} />
    </main>
  );
}
