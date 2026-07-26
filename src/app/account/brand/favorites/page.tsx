import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { getBrandFavorites } from "@/lib/data/brand-favorites";
import { makeUI } from "@/lib/i18n";
import { FavoritesView } from "./favorites-view";

/** "Favorites" — every project this BRAND member has hearted (#22). Private
 *  shortlist, no status pill (unlike My Interests) — a favorite is either
 *  saved or it isn't. Sort + comparison table (#4.7) live in the client
 *  FavoritesView; this server component only fetches. */
export default async function BrandFavoritesPage() {
  const user = await requireMember();
  if (user.role !== "BRAND") redirect("/account");

  const locale = await getLocale();
  const currency = await getCurrency();
  const t = makeUI(locale);
  const favorites = await getBrandFavorites(user.id, locale, currency);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t("account.brand.navFavorites")}</h1>
      <p className="mt-2 text-muted-foreground">{t("account.brand.favoritesSubtitle")}</p>

      <FavoritesView favorites={favorites} locale={locale} />
    </div>
  );
}
