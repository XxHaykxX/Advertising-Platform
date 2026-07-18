import type { Metadata } from "next";
import { getPortfolio } from "@/lib/data/portfolio";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { getSiteHeaderUser } from "@/lib/data/site-header-user";
import { PortfolioView } from "@/components/portfolio-page/portfolio-view";
import { PortfolioJsonLd } from "@/components/portfolio-page/portfolio-json-ld";

export const metadata: Metadata = {
  title: "Case Studies — iGovazd",
  description:
    "Real brand placements, real results — explore case studies from film and TV productions in the iGovazd catalog.",
  alternates: { canonical: "/portfolio" },
};

export default async function PortfolioPage() {
  const locale = await getLocale();
  const [cases, currency, user] = await Promise.all([
    getPortfolio(locale),
    getCurrency(),
    getSiteHeaderUser(),
  ]);

  return (
    <>
      <PortfolioJsonLd cases={cases} />
      <PortfolioView cases={cases} locale={locale} currency={currency} user={user} />
    </>
  );
}
