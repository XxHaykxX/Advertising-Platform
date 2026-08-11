"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Film, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenreBadge } from "@/components/ui/badge";
import { compareDeadline, daysUntil, formatFullDate, isArchived } from "@/lib/data/format";
import { cn } from "@/lib/utils";
import { intlLocale, useUI, useLocalizer, type Locale } from "@/lib/i18n-client";
import type { BrandFavoriteDTO } from "@/lib/data/brand-favorites";
import { RemoveFavoriteButton } from "./remove-favorite-button";

type SortKey = "added" | "price" | "deadline";

/** #4.7 — favorites got a sort control + a compact comparison table on top of
 *  the existing list, so a brand can size up its shortlist without opening
 *  each report individually. Notes-per-favorite were explicitly out of scope
 *  (would need a DB migration for a new column — flagged in the handoff). */
export function FavoritesView({ favorites, locale }: { favorites: BrandFavoriteDTO[]; locale: Locale }) {
  const t = useUI(locale);
  // Read the dictionary once here: the genre badge below renders inside
  // favorites.map(), and a context-reading helper called per item would make
  // the hook count track the list length.
  const localize = useLocalizer(locale);
  const [sort, setSort] = useState<SortKey>("added");

  const sorted = useMemo(() => {
    const list = [...favorites];
    if (sort === "price") {
      // Nulls (no tiers yet) sort last regardless of direction — there's
      // nothing to compare them by.
      list.sort((a, b) => {
        if (a.project.priceFromAmd == null) return b.project.priceFromAmd == null ? 0 : 1;
        if (b.project.priceFromAmd == null) return -1;
        return a.project.priceFromAmd - b.project.priceFromAmd;
      });
    } else if (sort === "deadline") {
      // An Ongoing project (IA-42) sorts after every dated one, and a
      // project with no deadline at all sorts after even that — see
      // compareDeadline.
      list.sort((a, b) => compareDeadline(a.project, b.project));
    }
    // "added" is already the fetch order (createdAt desc) — nothing to do.
    return list;
  }, [favorites, sort]);

  if (favorites.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
          <Heart className="h-6 w-6" />
        </div>
        <p className="text-lg font-semibold text-foreground">{t("account.brand.noFavoritesTitle")}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{t("account.brand.noFavoritesBody")}</p>
        <Button asChild variant="primary" size="md">
          <Link href="/catalog">{t("nav.browseProjects")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <label htmlFor="favorites-sort" className="text-sm font-medium text-muted-foreground">
          {t("account.brand.sortLabel")}
        </label>
        <select
          id="favorites-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="added">{t("account.brand.sortAdded")}</option>
          <option value="price">{t("account.brand.sortPriceAsc")}</option>
          <option value="deadline">{t("account.brand.sortDeadline")}</option>
        </select>
      </div>

      {/* Compact comparison table — horizontally scrollable on mobile so the
          columns never get crushed. */}
      <section>
        <h2 className="text-lg font-semibold text-foreground">{t("account.brand.compareTitle")}</h2>
        <div className="mt-3 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="border-b border-border pb-2 pr-4">{t("account.brand.compareProject")}</th>
                <th className="border-b border-border pb-2 pr-4">{t("account.brand.comparePriceFrom")}</th>
                <th className="border-b border-border pb-2 pr-4">{t("account.brand.compareSlots")}</th>
                <th className="border-b border-border pb-2 pr-4">{t("account.brand.compareDeadline")}</th>
                <th className="border-b border-border pb-2">{t("account.brand.compareFormat")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((favorite) => {
                const p = favorite.project;
                const deadlineDays = daysUntil(p.applicationDeadline);
                const deadlineUrgent = deadlineDays !== null && deadlineDays <= 45;
                const dash = t("account.brand.compareNoValue");
                return (
                  <tr key={favorite.id}>
                    <td className="border-b border-border py-2.5 pr-4">
                      <Link
                        href={`/reports/${p.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {p.title}
                      </Link>
                      {/* A shortlisted project can expire while it sits here.
                          Said outright, so the brand doesn't chase a listing
                          that no longer takes offers. */}
                      {isArchived(p.applicationDeadline, p.applicationDeadlineOngoing) ? (
                        <span className="ml-2 inline-block rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {t("report.offersClosed")}
                        </span>
                      ) : null}
                    </td>
                    <td className="border-b border-border py-2.5 pr-4 text-foreground">
                      {p.priceFromDisplay || dash}
                    </td>
                    <td className="border-b border-border py-2.5 pr-4 text-foreground">
                      {p.slotsTotal > 0 ? `${p.slotsAvailable} / ${p.slotsTotal}` : dash}
                    </td>
                    <td
                      className={cn(
                        "border-b border-border py-2.5 pr-4",
                        deadlineUrgent ? "text-warn" : "text-foreground",
                      )}
                    >
                      {p.applicationDeadlineOngoing
                        ? t("deadline.ongoing")
                        : p.applicationDeadline
                          ? formatFullDate(p.applicationDeadline, intlLocale(locale))
                          : dash}
                    </td>
                    <td className="border-b border-border py-2.5 text-foreground">{p.format || dash}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-col gap-4">
        {sorted.map((favorite) => (
          <div
            key={favorite.id}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
          >
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg sm:w-40">
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
                <GenreBadge>{localize("genre", favorite.project.genre)}</GenreBadge>
              </div>
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
    </div>
  );
}
