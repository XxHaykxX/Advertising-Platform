import Link from "next/link";
import { CalendarClock, CalendarDays } from "lucide-react";
import { AccentBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { formatFullDate, formatMonthYear, parseStringArray } from "@/lib/data/format";
import { DEFAULT_LOCALE, intlLocale, localizeValue, makeUI, type Locale } from "@/lib/i18n";
import { ReportInterestButton } from "@/components/report/report-interest-button";
import type { SiteHeaderUser } from "@/components/header";
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
  user = null,
}: {
  project: ProjectDetailDTO;
  locale?: Locale;
  user?: SiteHeaderUser | null;
}) {
  const t = makeUI(locale);
  const platforms = parseStringArray(project.platforms);
  const release = formatMonthYear(project.releaseDate, intlLocale(locale));
  // Fall back to the planned date when the project has no actual release yet
  // (audit 1.5 — the column existed but was never shown anywhere).
  const expectedRelease = release ? "" : formatMonthYear(project.expectedReleaseDate, intlLocale(locale));
  const deadline = formatFullDate(project.applicationDeadline, intlLocale(locale));

  return (
    <section className="pb-4">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <Reveal delay={0.2}>
          <div className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-card p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {release ? (
                <Fact icon={<CalendarDays className="h-3.5 w-3.5" />} label={t("keyFacts.release")} value={release} />
              ) : expectedRelease ? (
                <Fact
                  icon={<CalendarDays className="h-3.5 w-3.5" />}
                  label={t("keyFacts.expectedRelease")}
                  value={expectedRelease}
                />
              ) : null}

              {deadline ? (
                <Fact
                  icon={<CalendarClock className="h-3.5 w-3.5" />}
                  label={t("keyFacts.applicationDeadline")}
                  value={deadline}
                />
              ) : null}

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

              {project.cinemas.length > 0 ? (
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("keyFacts.cinemas")}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {project.cinemas.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {project.references.length > 0 ? (
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("keyFacts.comparableTo")}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {/* A reference may carry a link (the editor stores
                        [{name,url}]); render it as one when it does. */}
                    {project.references.map((r) =>
                      r.url ? (
                        <a
                          key={`${r.name}-${r.url}`}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-foreground underline-offset-2 transition-colors hover:border-primary hover:text-primary hover:underline"
                        >
                          {r.name}
                        </a>
                      ) : (
                        <span
                          key={r.name}
                          className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-foreground"
                        >
                          {r.name}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col items-start gap-3 border-t border-border pt-5 lg:items-end lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              {project.placementType ? (
                <AccentBadge>{localizeValue(locale, "placement", project.placementType)}</AccentBadge>
              ) : null}
              {/* Guests get the login CTA; a BRAND already viewing this report
                  gets the Express Interest trigger, which opens the
                  application popup (#23 — a link back to this same page was
                  a dead click). Other signed-in roles (CREATOR/staff) have no
                  use for either action here, so nothing is rendered. */}
              {!user ? (
                <Button asChild variant="primary" size="lg" className="w-full whitespace-nowrap lg:w-auto">
                  {/* ?from= brings the visitor back to THIS project after
                      signing in — the CTA used to drop them on the cabinet
                      dashboard with no way back (audit 4.3). */}
                  <Link href={`/login?from=/reports/${project.id}`}>{t("cta.loginToApply")}</Link>
                </Button>
              ) : user.role === "BRAND" ? (
                <ReportInterestButton
                  labelIdle={t("btn.expressInterest")}
                  labelSent={t("account.brand.alreadyInterested")}
                />
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
