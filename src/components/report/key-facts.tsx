import { CalendarClock, CalendarDays, DollarSign, Ticket } from "lucide-react";
import { AccentBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplyDialog } from "@/components/apply-dialog";
import { Reveal } from "@/components/ui/reveal";
import { formatFullDate, formatMonthYear, parseStringArray } from "@/lib/data/format";
import { DEFAULT_LOCALE, intlLocale, localizeValue, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectDetailDTO } from "@/lib/types";

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

export function KeyFacts({
  project,
  locale = DEFAULT_LOCALE,
}: {
  project: ProjectDetailDTO;
  locale?: Locale;
}) {
  const t = makeUI(locale);
  const platforms = parseStringArray(project.platforms);
  const available = Math.max(0, project.slotsTotal - project.slotsTaken);
  const pct =
    project.slotsTotal > 0
      ? Math.min(100, Math.round((project.slotsTaken / project.slotsTotal) * 100))
      : 0;
  const release = formatMonthYear(project.releaseDate, intlLocale(locale));
  const deadline = formatFullDate(project.applicationDeadline, intlLocale(locale));

  return (
    <section className="pb-4">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <Reveal delay={0.2}>
          <div className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-card p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Ticket className="h-3.5 w-3.5" />
                  {t("keyFacts.placementSlots")}
                </div>
                <div className="mt-1.5 text-sm font-semibold text-foreground">
                  {available} {t("keyFacts.available", { b: project.slotsTotal })}
                </div>
                <div className="mt-2 h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {release ? (
                <Fact icon={<CalendarDays className="h-3.5 w-3.5" />} label={t("keyFacts.release")} value={release} />
              ) : null}

              {deadline ? (
                <Fact
                  icon={<CalendarClock className="h-3.5 w-3.5" />}
                  label={t("keyFacts.applicationDeadline")}
                  value={deadline}
                />
              ) : null}

              <Fact
                icon={<DollarSign className="h-3.5 w-3.5" />}
                label={t("keyFacts.price")}
                value={project.priceDisplay ?? t("keyFacts.onRequest")}
              />

              {platforms.length > 0 ? (
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("keyFacts.platforms")}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {platforms.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end lg:border-l lg:border-border lg:pl-6">
              {project.placementType ? (
                <AccentBadge>{localizeValue(locale, "placement", project.placementType)}</AccentBadge>
              ) : null}
              <ApplyDialog
                projectId={project.id}
                projectTitle={project.title}
                locale={locale}
                trigger={
                  <Button variant="primary" size="lg" className="whitespace-nowrap">
                    {t("btn.expressInterest")}
                  </Button>
                }
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
