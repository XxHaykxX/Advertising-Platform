import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Film, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenreBadge } from "@/components/ui/badge";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { getBrandFavorites } from "@/lib/data/brand-favorites";
import { formatFullDate } from "@/lib/data/format";
import { intlLocale, localizeValue, makeUI } from "@/lib/i18n";
import { RemoveFavoriteButton } from "./remove-favorite-button";

/** "Favorites" — every project this BRAND member has hearted (#22). Private
 *  shortlist, no status pill (unlike My Interests) — a favorite is either
 *  saved or it isn't. */
export default async function BrandFavoritesPage() {
  const user = await requireMember();
  if (user.role !== "BRAND") redirect("/account");

  const locale = await getLocale();
  const t = makeUI(locale);
  const favorites = await getBrandFavorites(user.id, locale);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t("account.brand.navFavorites")}</h1>
      <p className="mt-2 text-muted-foreground">{t("account.brand.favoritesSubtitle")}</p>

      {favorites.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
            <Heart className="h-6 w-6" />
          </div>
          <p className="text-lg font-semibold text-foreground">{t("account.brand.noFavoritesTitle")}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t("account.brand.noFavoritesBody")}</p>
          <Button asChild variant="primary" size="md">
            <Link href="/account/brand/browse">{t("nav.browseProjects")}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-4">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
            >
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg sm:w-40">
                {favorite.project.poster ? (
                  <Image
                    src={favorite.project.poster}
                    alt={favorite.project.title}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Film className="h-6 w-6 text-primary/40" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-foreground">{favorite.project.title}</h3>
                  <GenreBadge>{localizeValue(locale, "genre", favorite.project.genre)}</GenreBadge>
                </div>
                <code className="text-xs text-muted-foreground">{favorite.project.code}</code>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("account.brand.favoritedOn", {
                    date: formatFullDate(favorite.createdAt, intlLocale(locale)),
                  })}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/reports/${favorite.project.id}`}>{t("btn.viewReport")}</Link>
                </Button>
                <RemoveFavoriteButton
                  projectId={favorite.project.id}
                  label={t("btn.removeFavorite")}
                  errorMessage={t("account.brand.expressInterestError")}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
