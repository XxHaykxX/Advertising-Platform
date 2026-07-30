import Link from "next/link";
import { CalendarClock, CalendarDays, Film, MonitorPlay, Popcorn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { formatFullDate, formatMonthYear, isArchived, parseStringArray } from "@/lib/data/format";
import { DEFAULT_LOCALE, intlLocale, makeUI, type Locale } from "@/lib/i18n";
import { ReportInterestButton } from "@/components/report/report-interest-button";
import type { SiteHeaderUser } from "@/components/header";
import type { ProjectDetailDTO } from "@/lib/types";

/** Deliberately a local copy of media-picker's isVideoPath: that module is
 *  "use client", and importing a plain function out of it makes this SERVER
 *  component call into a client module — Next throws "Attempted to call
 *  isVideoPath() from the server" at render time, which TypeScript can't see. */
function isVideoFile(path: string): boolean {
  return /\.(mp4|webm)$/i.test(path);
}

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
    <div className="break-words">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

/** Label above a chip row (platforms, cinemas) — same icon + uppercase-label
 *  shape as a Fact's own label, kept separate since chips aren't a Fact. */
function ChipLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {icon}
      {label}
    </div>
  );
}

/** Small uppercase divider that separates the card's four groups (what it is
 *  → where it airs → when → what it resembles) from each other — distinct
 *  from a Fact's own label so a group heading never reads like just another
 *  fact. No divider above the first group; it already sits under the card's
 *  own edge. */
function GroupHeading({ children }: { children: React.ReactNode }) {
  // Deliberately heavier than a Fact's own label (bigger, foreground, wider
  // tracking): rendered at the same size and muted colour, a heading read as
  // just another fact with no value under it. The dividers this used to draw
  // between groups went away with the stack — each group is its own panel now,
  // and a rule across a two-column grid would cut through both.
  return <div className="text-sm font-bold uppercase tracking-wider text-foreground">{children}</div>;
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
  const deadline = formatFullDate(project.applicationDeadline, intlLocale(locale));
  // Each group hides as a whole when every fact inside it is empty, so a
  // heading never renders above nothing (owner's group order: where it airs →
  // when → what it resembles; "what it is" moved to the hero's deal card).
  const hasWhere = platforms.length > 0 || project.cinemas.length > 0;
  const hasWhen = Boolean(release || deadline);
  const hasResembles = project.references.length > 0;
  // The action rendered under the facts, or nothing at all for a creator or
  // staff member who has nothing to apply for. Computed up front so the row
  // that holds it can disappear with it — a reserved-but-empty CTA column was
  // what left the card's whole right half blank (owner report 2026-07-30).
  // Past the placement deadline the project is archived and takes no more
  // offers, so a guest is told that instead of being sent to sign in for a
  // button that would be disabled anyway.
  const cta = isArchived(project.applicationDeadline) ? (
    <Button variant="secondary" size="lg" disabled className="w-full whitespace-nowrap sm:w-auto">
      {t("report.offersClosed")}
    </Button>
  ) : !user ? (
    <Button asChild variant="primary" size="lg" className="w-full whitespace-nowrap sm:w-auto">
      {/* ?from= brings the visitor back to THIS project after signing in — the
          CTA used to drop them on the cabinet dashboard with no way back
          (audit 4.3). */}
      <Link href={`/login?from=/reports/${project.id}`}>{t("cta.loginToApply")}</Link>
    </Button>
  ) : user.role === "BRAND" ? (
    <ReportInterestButton
      labelIdle={t("report.offerBarCta")}
      labelSent={t("account.brand.alreadyInterested")}
    />
  ) : null;

  return (
    <section className="pb-4">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <Reveal delay={0.2}>
          {/* Tighter padding on a phone: at 375px the card's own 24px inset
              plus a panel's 20px left only ~255px for the chip rows, which put
              every second chip on a line of its own. */}
          <div className="rounded-2xl border border-border bg-card p-6 max-sm:p-4">
            {/* Two columns of panels rather than one tall stack down the left:
                stacked, the groups left the card's right half empty at desktop
                width. "Comparable to" spans both because its posters need the
                room. */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Genre / format / studio / countries used to open this card.
                  They now live in the hero's deal card, where a brand reads
                  them before it scrolls (owner decision 2026-07-30) — repeating
                  them here would be the same four facts twice on one screen. */}
              {hasWhere ? (
                <div className="rounded-xl bg-muted/40 p-5 max-sm:p-4">
                  <GroupHeading>{t("keyFacts.groupWhere")}</GroupHeading>
                  <div className="mt-3 flex flex-col gap-4">
                    {platforms.length > 0 ? (
                      <div>
                        <ChipLabel icon={<MonitorPlay className="h-3.5 w-3.5" />} label={t("keyFacts.platforms")} />
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
                      <div>
                        <ChipLabel icon={<Popcorn className="h-3.5 w-3.5" />} label={t("keyFacts.cinemas")} />
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
                  </div>
                </div>
              ) : null}

              {hasWhen ? (
                <div className="rounded-xl bg-muted/40 p-5 max-sm:p-4">
                  <GroupHeading>{t("keyFacts.groupWhen")}</GroupHeading>
                  <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                  </div>
                </div>
              ) : null}

              {hasResembles ? (
                <div className="rounded-xl bg-muted/40 p-5 max-sm:p-4 lg:col-span-2">
                  <GroupHeading>{t("keyFacts.comparableTo")}</GroupHeading>
                  {/* A reference carries a name plus, optionally, a link and an
                      uploaded still/clip. With media it gets a card (the visual
                      is the point); without, the compact chip it always was. */}
                  {project.references.some((r) => r.media) ? (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {project.references.map((r) => {
                        const body = (
                          <>
                            <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
                              {r.media ? (
                                isVideoFile(r.media) ? (
                                  <video
                                    src={r.media}
                                    className="h-full w-full object-cover"
                                    muted
                                    playsInline
                                    preload="metadata"
                                  />
                                ) : (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={r.media} alt="" className="h-full w-full object-cover" />
                                )
                              ) : (
                                <div className="grid h-full w-full place-items-center text-muted-foreground">
                                  <Film className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="mt-1.5 text-xs font-medium text-foreground">{r.name}</div>
                          </>
                        );
                        return r.url ? (
                          <a
                            key={`${r.name}-${r.url}`}
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block transition-opacity hover:opacity-90"
                          >
                            {body}
                          </a>
                        ) : (
                          <div key={r.name}>{body}</div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-1.5">
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
                  )}
                </div>
              ) : null}
            </div>

            {/* Guests get the login CTA; a BRAND gets the Express Interest
                trigger, which opens the application popup (#23 — a link back
                to this same page was a dead click). A creator or staff member
                has no use for either, and then this row isn't there at all. */}
            {cta ? (
              <div className="mt-5 flex justify-end border-t border-border pt-5 max-sm:justify-stretch">
                {cta}
              </div>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
