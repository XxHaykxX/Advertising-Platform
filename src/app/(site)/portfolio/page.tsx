import type { Metadata } from "next";
import { Portfolio } from "@/components/sections/portfolio";
import { getPortfolioCases } from "@/lib/data/portfolio";
import { getContent } from "@/lib/data/content";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: makeUI(locale)("nav.portfolio") };
}

export default async function PortfolioPage() {
  const locale = await getLocale();
  const [cases, t] = await Promise.all([
    getPortfolioCases(locale),
    getContent(locale),
  ]);

  return (
    <main>
      <Portfolio cases={cases} t={t} locale={locale} />
    </main>
  );
}
