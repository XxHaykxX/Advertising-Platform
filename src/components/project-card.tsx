import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clapperboard,
  Clock,
  Eye,
  Film,
  MapPin,
  Users,
  Wallet,
} from "lucide-react";
import { AccentBadge, GenreBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { daysUntil, formatFullDate, formatMonthYear, parseStringArray, splitCountries } from "@/lib/data/format";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, intlLocale, localizeValue, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectListDTO } from "@/lib/types";

export function ProjectCard({
  project,
  locale = DEFAULT_LOCALE,
}: {
  project: ProjectListDTO;
  locale?: Locale;
}) {
  const t = makeUI(locale);
  const countries = splitCountries(project.countries);
  const shownCountries = countries.slice(0, 3);
  const extraCountries = countries.length - shownCountries.length;
  const platforms = parseStringArray(project.platforms);
  const releaseLabel = formatMonthYear(project.releaseDate, intlLocale(locale));
  const deadlineDays = daysUntil(project.applicationDeadline);
  const deadlineUrgent = deadlineDays !== null && deadlineDays <= 45;

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card card-lift">
      {/* Whole-card click target → report. Sits under the action buttons
          (which are z-10) so Apply / View Report still work. */}
      <Link
        href={`/reports/${project.id}`}
        aria-label={project.title}
        className="absolute inset-0 z-10"
      />
      <div className="relative aspect-[16/10] shrink-0">
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
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground md:text-xl">{project.title}</h3>
          {project.placementType ? (
            <AccentBadge>{localizeValue(locale, "placement", project.placementType)}</AccentBadge>
          ) : null}
        </div>
        <code className="text-xs text-muted-foreground">{project.code}</code>
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{project.synopsis}</p>

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
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>
              {[localizeValue(locale, "gender", project.audienceGender), project.audienceAge]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
          {project.budgetDisplay ? (
            <div className="flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5 shrink-0" />
              <span>{project.budgetDisplay}</span>
            </div>
          ) : null}
          {project.projViews ? (
            <div className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              <span>{project.projViews} {t("card.projectedViews")}</span>
            </div>
          ) : null}
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

        <p className="mt-3 text-xs text-muted-foreground">
          {project.priceDisplay ?? t("keyFacts.onRequest")}
          {project.priceNote ? <span className="ml-1">({project.priceNote})</span> : null}
        </p>

        {/* Grid cards are narrow (≈33vw on desktop) and the primary CTA label
            is long in every locale, so a side-by-side row overflows the card
            (clipped by overflow-hidden). Stack both buttons full-width at all
            breakpoints — never overflows, aligns across cards. */}
        <div className="relative z-20 mt-auto flex flex-col gap-2 pt-6">
          {/* Long CTA label in ru/hy — allow it to wrap to 2 lines (the base
              Button is nowrap + fixed height, which clips it in a narrow card). */}
          <Button
            asChild
            variant="primary"
            size="sm"
            className="h-auto min-h-9 w-full whitespace-normal py-1.5 text-center leading-tight"
          >
            <Link href="/login">{t("cta.loginToApply")}</Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="w-full">
            <Link href={`/reports/${project.id}`}>{t("btn.viewReport")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
