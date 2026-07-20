import type { Metadata } from "next";
import { getProjects } from "@/lib/data/projects";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { getSiteHeaderUser } from "@/lib/data/site-header-user";
import { getBrandFavoriteSet } from "@/lib/data/favorites";
import { loadCurrentUser } from "@/lib/auth/require";
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
  const [projects, user, currentUser] = await Promise.all([
    getProjects(locale, currency),
    getSiteHeaderUser(),
    loadCurrentUser(),
  ]);
  // Favorites (#22) are a BRAND-only private shortlist — everyone else gets
  // an empty set, which renders every heart outline/inert.
  const favorites =
    currentUser?.role === "BRAND" ? await getBrandFavoriteSet(currentUser.id) : new Set<number>();

  return (
    <CatalogView
      projects={projects}
      locale={locale}
      currency={currency}
      user={user}
      favorites={favorites}
      signedIn={currentUser !== null}
      isBrand={currentUser?.role === "BRAND"}
    />
  );
}
