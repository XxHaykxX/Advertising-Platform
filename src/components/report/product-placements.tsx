import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { OfferApplyButton } from "@/components/report/offer-apply-button";
import { offerValue } from "@/lib/offer-value";
import type { ProjectDetailDTO } from "@/lib/types";

/**
 * Product placement — the brand inside the story (owner correction 2026-07-28).
 *
 * Sits ABOVE the sponsorship packages, because it is the thing a brand comes
 * here for; sponsorship (logo on promo materials, credits) is the other offer
 * and lives in `sponsors.tsx`.
 *
 * A still carries most of the meaning, so each row leads with its image. Price
 * is optional: a creator who hasn't priced an integration leaves it empty and
 * the card says "on request" rather than publishing a number nobody agreed to.
 */
export function ProductPlacements({
  project,
  locale = DEFAULT_LOCALE,
}: {
  project: ProjectDetailDTO;
  locale?: Locale;
}) {
  if (project.placements.length === 0) return null;
  const t = makeUI(locale);

  return (
    <section id="placements" className="py-10">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <Reveal>
          <h2 className="text-2xl font-bold text-foreground">{t("report.placementsTitle")}</h2>
          <p className="mt-1 text-sm text-foreground/70">{t("report.placementsSubtitle")}</p>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {project.placements.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.05}>
              <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
                {p.image ? (
                  // The still is the frame's background, not a screenshot sitting
                  // above the copy: a bottom-up veil plus a blurred glass panel
                  // carries the title and price straight on the image, so the
                  // typography reads as part of the shot (owner request 2026-08-05).
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <Image
                      src={p.image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent pt-12">
                      {/* Hairline highlight along the panel's top edge + a light
                          blur on the panel itself — the two cues that read as
                          "glass" rather than a flat gradient. */}
                      {/* Type scale matched to the sponsorship cards (owner
                          request 2026-08-05): calm regular-weight name at
                          display size, price as the dominant figure under it.
                          Only the colours differ, because here the pair sits on
                          the still rather than on the card surface. */}
                      <div className="border-t border-white/15 px-5 py-4 backdrop-blur-sm">
                        <h3 className="line-clamp-2 text-2xl font-normal tracking-tight text-white">
                          {p.title}
                        </h3>
                        {/* No price is a deliberate state, not a missing one. */}
                        <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                          {p.priceDisplay ?? (
                            <span className="text-base font-semibold text-white/75">
                              {t("report.priceOnRequest")}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-1 flex-col p-7">
                  {/* Without a still there is no glass panel to carry the title
                      onto, so it stays here as plain text (must keep working —
                      not every placement has an image). Same scale as the glass
                      panel above and as the sponsorship cards. */}
                  {!p.image ? (
                    <>
                      <h3 className="text-2xl font-normal tracking-tight text-foreground">
                        {p.title}
                      </h3>
                      <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
                        {p.priceDisplay ?? (
                          <span className="text-base font-semibold text-foreground/80">
                            {t("report.priceOnRequest")}
                          </span>
                        )}
                      </p>
                    </>
                  ) : null}
                  {/* The "X / Y slots free" line used to sit here — removed
                      from the storefront cards on the owner's call
                      (2026-08-05); see the same note in sponsors.tsx. */}
                  {p.description.length > 0 ? (
                    <>
                      {/* The hairline that separates the offer's headline from
                          what it includes — the same divider the sponsorship
                          cards use. With a still, the headline lives on the
                          glass above, so this rule opens the body; without one
                          it follows the price directly, exactly as in
                          sponsors.tsx. */}
                      <div className={p.image ? "h-px bg-foreground/20" : "mt-5 h-px bg-foreground/20"} />
                      <ul className="mt-5 space-y-2 text-sm text-foreground/75">
                        {p.description.map((line) => (
                          <li key={line} className="flex gap-2.5">
                            <span
                              aria-hidden
                              className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/45"
                            />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {/* Pinned to the card's bottom (mt-auto) so every card in a
                      row lines its button up on one edge regardless of how
                      long its bullet list is. */}
                  <div className="mt-auto pt-6">
                    <OfferApplyButton
                      offer={offerValue({ id: p.id, kind: "PLACEMENT" })}
                      // Same short wording as the sticky bar and the facts
                      // block: three different names for one action read as
                      // three different actions (owner decision 2026-07-29).
                      // The card the button sits in already says which offer
                      // it is about.
                      label={t("report.offerBarCta")}
                      sentLabel={t("report.offerApplied")}
                    />
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
