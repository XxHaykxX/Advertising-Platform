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
 * The card is deliberately the SAME card as a sponsorship package (owner
 * decision 2026-08-05): still on top, then name, price, a hairline rule and
 * what the brand gets. A version that laid the name and price onto the still
 * behind a glass panel was tried and dropped — two offer sections sitting one
 * above the other read as two different products when their cards disagree.
 * Keep the two files' card bodies in step.
 *
 * Price is optional: a creator who hasn't priced an integration leaves it empty
 * and the card says "on request" rather than publishing a number nobody agreed
 * to.
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

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {project.placements.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.05}>
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
                {p.image ? (
                  <div className="relative aspect-video w-full bg-muted">
                    <Image
                      src={p.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    />
                  </div>
                ) : null}

                <div className="flex flex-1 flex-col p-7">
                  {/* Calm regular weight at display size, price as the dominant
                      figure under it — the same scale as sponsors.tsx. */}
                  <h3 className="text-2xl font-normal tracking-tight text-foreground">{p.title}</h3>
                  {/* No price is a deliberate state, not a missing one. */}
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
                    {p.priceDisplay ?? (
                      <span className="text-base font-semibold text-foreground/80">
                        {t("report.priceOnRequest")}
                      </span>
                    )}
                  </p>
                  {/* The "X / Y slots free" line used to sit here — removed
                      from the storefront cards on the owner's call
                      (2026-08-05); see the same note in sponsors.tsx. */}
                  {p.description.length > 0 ? (
                    <>
                      <div className="mt-5 h-px bg-foreground/20" />
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
