import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clapperboard,
  Clock,
  Eye,
  Film,
  MapPin,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { AccentBadge, GenreBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplyDialog } from "@/components/apply-dialog";
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
  const slotsLeft = Math.max(project.slotsTotal - project.slotsTaken, 0);
  const slotsPct = project.slotsTotal > 0 ? Math.min((project.slotsTaken / project.slotsTotal) * 100, 100) : 0;
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
            <span>{localizeValue(locale, "gender", project.audienceGender)}, {project.audienceAge}</span>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>{project.opportunitiesCount} {t("card.opportunities")}</span>
          </div>
          {project.budgetDisplay ? (
            <div className="flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5 shrink-0" />
              <span>{project.budgetDisplay}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span>{project.projViews} {t("card.projectedViews")}</span>
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

        {project.slotsTotal > 0 ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>{slotsLeft} {t("card.slotsAvailable", { b: project.slotsTotal })}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${slotsPct}%` }}
              />
            </div>
          </div>
        ) : null}

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

        <div className="relative z-20 mt-auto flex gap-3 pt-6">
          <Button asChild variant="primary" size="sm">
            <Link href={`/reports/${project.id}`}>{t("btn.viewReport")}</Link>
          </Button>
          <ApplyDialog
            projectId={project.id}
            projectTitle={project.title}
            locale={locale}
            trigger={
              <Button variant="ghost" size="sm">
                {t("btn.requestDetails")}
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
