import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { getProjects } from "@/lib/data/projects";
import { getBrandFavoriteSet } from "@/lib/data/favorites";
import { makeUI } from "@/lib/i18n";
import { BrowseView } from "./browse-view";

/** "Browse Projects" — the BRAND cabinet's catalog (#23). Reuses the public
 *  data layer (getProjects) so it stays in lockstep with the public /catalog
 *  page's project shape; the only brand-specific addition is the per-project
 *  Favorite state (getBrandFavoriteSet) driving each card's heart (#22). */
export default async function BrandBrowsePage() {
  const user = await requireMember();
  if (user.role !== "BRAND") redirect("/account");

  const locale = await getLocale();
  const currency = await getCurrency();
  const t = makeUI(locale);

  const [projects, favorites] = await Promise.all([
    getProjects(locale, currency),
    getBrandFavoriteSet(user.id),
  ]);

  return (
    <BrowseView
      projects={projects}
      favorites={favorites}
      locale={locale}
      title={t("nav.browseProjects")}
    />
  );
}
