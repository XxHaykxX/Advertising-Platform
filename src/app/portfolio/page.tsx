import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPortfolio } from "@/lib/data/portfolio";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { getSiteHeaderUser } from "@/lib/data/site-header-user";
import { PortfolioView } from "@/components/portfolio-page/portfolio-view";
import { PortfolioJsonLd } from "@/components/portfolio-page/portfolio-json-ld";
import { PORTFOLIO_ENABLED } from "@/lib/feature-flags";

// The `canonical: "/portfolio"` link is dropped while the page is hidden
// (PORTFOLIO_ENABLED, src/lib/feature-flags.ts) — nothing should point search
// engines at a route that 404s. Restored automatically once the flag flips
// back to true.
export const metadata: Metadata = PORTFOLIO_ENABLED
  ? {
      title: "Case Studies — iGovazd",
      description:
        "Real brand placements, real results — explore case studies from film and TV productions in the iGovazd catalog.",
      alternates: { canonical: "/portfolio" },
    }
  : {};

export default async function PortfolioPage() {
  // The public page is off while the owner keeps preparing cases; the admin
  // Portfolio section (src/app/admin/(panel)/portfolio/) stays untouched —
  // this only gates the public route. notFound() also injects its own
  // noindex tag, on top of the site-wide `disallow: "/"` in robots.ts.
  if (!PORTFOLIO_ENABLED) notFound();

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
