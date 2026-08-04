import Image from "next/image";
import { AccentBadge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { OfferApplyButton } from "@/components/report/offer-apply-button";
import { offerValue } from "@/lib/offer-value";
import type { ProjectDetailDTO } from "@/lib/types";

// Sponsorship packages — priced tiers a brand can buy into. Each package
// shows its price, its benefits list, and — when set on the tier — how many
// placements are still open ("X / Y") plus an Exclusive badge (T23).
export function Sponsors({
  project,
  locale = DEFAULT_LOCALE,
}: {
  project: ProjectDetailDTO;
  locale?: Locale;
}) {
  if (project.tiers.length === 0) return null;
  const t = makeUI(locale);

  return (
    <section id="sponsors" className="py-10">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <Reveal>
          <h2 className="text-2xl font-bold text-foreground">{t("investment.sponsorsTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("investment.sponsorsSubtitle")}</p>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {project.tiers.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 0.05}>
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
                {tier.image ? (
                  <div className="relative aspect-video w-full bg-muted">
                    <Image
                      src={tier.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    />
                  </div>
                ) : null}

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                    {tier.isExclusive ? <AccentBadge>{t("report.exclusive")}</AccentBadge> : null}
                  </div>
                  {/* No price is a deliberate state, not a missing one. */}
                  <p className="mt-1 text-xl font-extrabold text-foreground">
                    {tier.priceDisplay ?? (
                      <span className="text-base font-semibold text-muted-foreground">
                        {t("report.priceOnRequest")}
                      </span>
                    )}
                  </p>
                  {tier.totalSlots != null && tier.totalSlots > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tier.availableSlots ?? 0} / {tier.totalSlots} {t("report.slotsAvailable")}
                    </p>
                  ) : null}
                  {tier.benefits.length > 0 ? (
                    <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                      {tier.benefits.map((b) => (
                        <li key={b}>• {b}</li>
                      ))}
                    </ul>
                  ) : null}
                  {/* Pinned to the card's bottom (mt-auto) so every card in a
                      row lines its button up on one edge regardless of how
                      long its benefits list is. */}
                  <div className="mt-auto pt-4">
                    <OfferApplyButton
                      offer={offerValue({ id: tier.id, kind: "TIER" })}
                      // One short wording for the action everywhere on the
                      // page — see the note in product-placements.tsx.
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
