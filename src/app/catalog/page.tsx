import type { Metadata } from "next";
import { getProjects } from "@/lib/data/projects";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { CatalogView } from "./catalog-view";

export const metadata: Metadata = {
  title: "Catalog — iGovazd",
  description:
    "Browse film and TV productions open for brand placement — filter by genre, product category, and status.",
  alternates: { canonical: "/catalog" },
};

export default async function CatalogPage() {
  const locale = await getLocale();
  const currency = await getCurrency();
  const projects = await getProjects(locale, currency);
  return <CatalogView projects={projects} locale={locale} currency={currency} />;
}
