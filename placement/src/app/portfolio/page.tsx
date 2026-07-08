import type { Metadata } from "next";
import { getPortfolio } from "@/lib/data/portfolio";
import { PortfolioView } from "@/components/portfolio-page/portfolio-view";
import { PortfolioJsonLd } from "@/components/portfolio-page/portfolio-json-ld";

export const metadata: Metadata = {
  title: "Case Studies — FP Placement",
  description:
    "Real brand placements, real results — explore case studies from film and TV productions in the FP Placement catalog.",
};

export default async function PortfolioPage() {
  const cases = await getPortfolio();

  return (
    <>
      <PortfolioJsonLd cases={cases} />
      <PortfolioView cases={cases} />
    </>
  );
}
