import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth/require";
import { canBuy, canSell } from "@/lib/auth/capabilities";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { getProjects } from "@/lib/data/projects";
import { getBrandFavoriteSet, getOwnedProjectIdSet } from "@/lib/data/favorites";
import { makeUI } from "@/lib/i18n";
import { BrowseView } from "./browse-view";

/** "Browse Projects" — the BRAND cabinet's catalog (#23). Reuses the public
 *  data layer (getProjects) so it stays in lockstep with the public /catalog
 *  page's project shape; the only brand-specific addition is the per-project
 *  Favorite state (getBrandFavoriteSet) driving each card's heart (#22). */
export default async function BrandBrowsePage() {
  const user = await requireMember();
  if (!canBuy(user)) redirect("/account");

  const locale = await getLocale();
  const currency = await getCurrency();
  const t = makeUI(locale);

  const [projects, favorites, ownIds] = await Promise.all([
    getProjects(locale, currency),
    getBrandFavoriteSet(user.id),
    // Nobody buys from themselves — a dual member's own listing can show up
    // in this same grid (it's just getProjects), so it needs the same guard
    // the public catalog has.
    canSell(user) ? getOwnedProjectIdSet(user.id) : Promise.resolve(new Set<number>()),
  ]);

  return (
    <BrowseView
      projects={projects}
      favorites={favorites}
      ownIds={ownIds}
      locale={locale}
      title={t("nav.browseProjects")}
    />
  );
}
