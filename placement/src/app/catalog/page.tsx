import type { Metadata } from "next";
import { getProjects } from "@/lib/data/projects";
import { getLocale } from "@/lib/data/locale";
import { CatalogView } from "./catalog-view";

export const metadata: Metadata = {
  title: "Catalog — iGovazd",
  description:
    "Browse film and TV productions open for brand placement — filter by genre, product category, status, and brand safety.",
  alternates: { canonical: "/catalog" },
};

export default async function CatalogPage() {
  const [projects, locale] = await Promise.all([getProjects(), getLocale()]);
  return <CatalogView projects={projects} locale={locale} />;
}
