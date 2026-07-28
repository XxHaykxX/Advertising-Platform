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
import { daysUntil, formatFullDate, formatMonthYear, parseStringArray, splitCountries } from "@/lib/data/format";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, intlLocale, localizeValue, makeUI, type Locale } from "@/lib/i18n";
import type { SiteHeaderUser } from "@/components/header";
import type { ProjectListDTO } from "@/lib/types";

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
  const countries = splitCountries(project.countries);
  const shownCountries = countries.slice(0, 3);
  const extraCountries = countries.length - shownCountries.length;
  const platforms = parseStringArray(project.platforms);
  const releaseLabel = formatMonthYear(project.releaseDate, intlLocale(locale));
  const deadlineDays = daysUntil(project.applicationDeadline);
  const deadlineUrgent = deadlineDays !== null && deadlineDays <= 45;
  // 5.6: the poster overlay keeps showing genres[0] only (unchanged), but a
  // project can carry more than one genre — surface those too instead of
  // silently dropping them. Cap the extra chips at 2 and collapse the rest
  // into a "+N" pill, same convention as the country list above.
  const allGenres = project.genres.length > 0 ? project.genres : [project.genre];
  const extraGenres = allGenres.slice(1);
  const shownExtraGenres = extraGenres.slice(0, 2);
  const moreGenres = extraGenres.length - shownExtraGenres.length;
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
        <div className="absolute left-3 top-3">
          <GenreBadge>{localizeValue(locale, "genre", project.genre)}</GenreBadge>
        </div>
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
          {shownExtraGenres.map((g) => (
            <GenreBadge key={g}>{localizeValue(locale, "genre", g)}</GenreBadge>
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
          <div className="flex items-center gap-2">
            <Clapperboard className="h-3.5 w-3.5 shrink-0" />
            <span>{project.format}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>
              {shownCountries.join(", ")}
              {extraCountries > 0 ? ` +${extraCountries}` : ""}
            </span>
          </div>
          {releaseLabel ? (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{t("card.release")}: {releaseLabel}</span>
            </div>
          ) : null}
          {project.applicationDeadline ? (
            <div className={cn("flex items-center gap-2", deadlineUrgent ? "text-warn" : undefined)}>
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{t("card.applicationsUntil")} {formatFullDate(project.applicationDeadline, intlLocale(locale))}</span>
            </div>
          ) : null}
        </div>

        {platforms.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {platforms.map((p) => (
              <span
                key={p}
                className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {p}
              </span>
            ))}
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
