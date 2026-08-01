"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clapperboard,
  Clock,
  Film,
  MapPin,
} from "lucide-react";
import { GenreBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteHeart } from "@/components/favorite-heart";
import { daysUntil, formatFullDate, formatReleaseDate, parseStringArray, splitCountries } from "@/lib/data/format";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, intlLocale, makeUI, useLocalizer, type Locale } from "@/lib/i18n-client";
import type { SiteHeaderUser } from "@/components/header";
import type { ProjectListDTO } from "@/lib/types";

/** Explicitly "use client" (bundle audit 2026-07-31): its only two callers
 *  (catalog-view.tsx, browse-view.tsx) render it in a loop over
 *  client-side-filtered/sorted project arrays, so it always runs in the
 *  browser anyway — marking it avoids it silently falling back to
 *  server-only i18n imports that would break the moment it's rendered from a
 *  Client Component. */
export function ProjectCard({
  project,
  locale = DEFAULT_LOCALE,
  user = null,
  favorited = false,
  canFavorite = false,
  signedIn = false,
}: {
  project: ProjectListDTO;
  locale?: Locale;
  user?: SiteHeaderUser | null;
  favorited?: boolean;
  canFavorite?: boolean;
  signedIn?: boolean;
}) {
  const t = makeUI(locale);
  // One hook call up front — shownGenres.map() below (variable-length,
  // depends on the project) calls this per item; localizeValue() itself
  // reads context and can't be called inside a loop.
  const localize = useLocalizer(locale);
  const countries = splitCountries(project.countries);
  const shownCountries = countries.slice(0, 3);
  const extraCountries = countries.length - shownCountries.length;
  const platforms = parseStringArray(project.platforms);
  // Compact card: month + year at DAY precision (unchanged from before
  // precision existed), month + year at MONTH, bare year at YEAR — never
  // inventing a day/month the editor didn't actually give (IA-42).
  const releaseLabel = formatReleaseDate(project.releaseDate, project.releasePrecision, intlLocale(locale), true);
  const deadlineDays = daysUntil(project.applicationDeadline);
  const deadlineUrgent = deadlineDays !== null && deadlineDays <= 45;
  // IA-41: the poster overlay used to show genres[0] only and the row under
  // the title started at genres[1] to avoid repeating it. The overlay is gone
  // now (it covered the image and still dropped every genre past the first),
  // so the row under the title starts at genres[0] and carries all of them.
  // Cap at 3 badges and collapse the rest into a "+N" pill, same convention
  // as the country list above.
  // .filter(Boolean): a project with neither `genres` nor a legacy `genre`
  // (both empty) fell back to [""], rendering an empty grey pill — exactly
  // the "chip with no value" bug IA-41 was about (review finding, 2026-08-02).
  const allGenres = (project.genres.length > 0 ? project.genres : [project.genre]).filter(Boolean);
  const shownGenres = allGenres.slice(0, 3);
  const moreGenres = allGenres.length - shownGenres.length;
  // Language is a CSV of one or more values (admin redesign phase 1) — used to
  // only drive the filter and was never shown on the card itself.

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card card-lift">
      {/* Whole-card click target → report. Sits under the action buttons
          (which are z-10) so Apply / View Report still work. */}
      <Link
        href={`/reports/${project.id}`}
        aria-label={project.title}
        className="absolute inset-0 z-10"
      />
      <div className="relative aspect-video shrink-0">
        {project.poster ? (
          <Image
            src={project.poster}
            alt={project.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Film className="h-10 w-10 text-primary/40" />
          </div>
        )}
        <FavoriteHeart
          projectId={project.id}
          initialFavorite={favorited}
          canFavorite={canFavorite}
          signedIn={signedIn}
          addAria={t("favorite.addAria")}
          removeAria={t("favorite.removeAria")}
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground md:text-xl">{project.title}</h3>
          {shownGenres.map((g) => (
            <GenreBadge key={g}>{localize("genre", g)}</GenreBadge>
          ))}
          {moreGenres > 0 ? <GenreBadge>+{moreGenres}</GenreBadge> : null}
          {project.slotsTotal > 0 ? (
            <GenreBadge>
              {project.slotsAvailable} / {project.slotsTotal} {t("card.slotsAvailable")}
            </GenreBadge>
          ) : null}
          {/* How many product placements the project offers (owner request
              2026-07-28). Counted from real rows, so a project with none says
              nothing rather than printing a zero. */}
          {project.placementsCount > 0 ? (
            <GenreBadge>
              {project.placementsCount}{" "}
              {t(project.placementsCount === 1 ? "card.placementsOne" : "card.placementsMany")}
            </GenreBadge>
          ) : null}
        </div>
        <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
          {/* IA-41: format and countries used to render unconditionally, so a
              project missing either printed a bare icon next to an empty
              string. Same rule as release/deadline below — no value, no row. */}
          {project.format ? (
            <div className="flex items-center gap-2">
              <Clapperboard className="h-3.5 w-3.5 shrink-0" />
              <span>{project.format}</span>
            </div>
          ) : null}
          {shownCountries.length > 0 ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>
                {shownCountries.join(", ")}
                {extraCountries > 0 ? ` +${extraCountries}` : ""}
              </span>
            </div>
          ) : null}
          {releaseLabel ? (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{t("card.release")}: {releaseLabel}</span>
            </div>
          ) : null}
          {project.applicationDeadline || project.applicationDeadlineOngoing ? (
            <div className={cn("flex items-center gap-2", deadlineUrgent ? "text-warn" : undefined)}>
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                {project.applicationDeadlineOngoing
                  ? t("deadline.ongoing")
                  : `${t("card.applicationsUntil")} ${formatFullDate(project.applicationDeadline, intlLocale(locale))}`}
              </span>
            </div>
          ) : null}
        </div>

        {platforms.length > 0 ? (
          <div className="mt-3">
            {/* IA-41: the chip row had no label — say what these values ARE
                before listing them, same as the report page's platform row. */}
            <span className="text-[11px] font-medium text-muted-foreground">{t("card.availableOn")}</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {platforms.map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* The interest action moved to the heart (favorite) + the report page's
            Apply popup, so the card keeps a single "View report" CTA. */}
        <div className="relative z-20 mt-auto pt-6">
          <Button asChild variant="secondary" size="sm" className="w-full">
            <Link href={`/reports/${project.id}`}>{t("btn.viewReport")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
