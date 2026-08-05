import { Film } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectDetailDTO } from "@/lib/types";

/** Deliberately a local copy of media-picker's isVideoPath: that module is
 *  "use client", and importing a plain function out of it makes this SERVER
 *  component call into a client module — Next throws "Attempted to call
 *  isVideoPath() from the server" at render time, which TypeScript can't see. */
function isVideoFile(path: string): boolean {
  return /\.(mp4|webm)$/i.test(path);
}

/** What is left of the old facts block: the "comparable to" references.
 *
 *  Everything else moved into the hero's deal card, in three passes. Genre,
 *  format, studio and countries went on 2026-07-30. Platforms, cinemas and the
 *  release date followed on 2026-08-05, on the same reasoning — a brand read the
 *  price in the deal card and then had to scroll to a second card to learn where
 *  and when the thing airs. The application deadline was already there.
 *
 *  The apply button that used to close this card went with them. It was a
 *  duplicate: DealCta in the hero does the identical viewer branching (guest →
 *  sign in, brand → application popup, archived → closed, creator/staff →
 *  nothing), sits above the fold, and is the button a brand actually reaches
 *  for. Two primary buttons on one screen, both opening the same popup, made
 *  the page look like it was asking twice.
 *
 *  References earn a section of their own: they are the one thing here that is
 *  visual, and they need the full page width for their posters. */
export function KeyFacts({
  project,
  locale = DEFAULT_LOCALE,
}: {
  project: ProjectDetailDTO;
  locale?: Locale;
}) {
  const t = makeUI(locale);

  // Nothing to compare against — render nothing at all rather than an empty
  // bordered card, the same rule the deal card follows.
  if (project.references.length === 0) return null;

  return (
    <section className="pb-4">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <Reveal delay={0.2}>
          {/* Tighter padding on a phone: at 375px the card's own 24px inset
              plus a panel's 20px left only ~255px for the content. */}
          <div className="rounded-2xl border border-border bg-card p-6 max-sm:p-4">
            <div className="rounded-xl bg-muted/40 p-5 max-sm:p-4">
              {/* Deliberately heavier than a plain label (bigger, foreground,
                  wider tracking): at label size and muted colour this read as
                  just another fact with no value under it. */}
              <div className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t("keyFacts.comparableTo")}
              </div>
              {/* A reference carries a name plus, optionally, a link and an
                  uploaded still/clip. With media it gets a card (the visual is
                  the point); without, the compact chip it always was. */}
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
          </div>
        </Reveal>
      </div>
    </section>
  );
}
