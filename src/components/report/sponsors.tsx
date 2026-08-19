import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { OfferApplyButton } from "@/components/report/offer-apply-button";
import { offerValue } from "@/lib/offer-value";
import { mediaUrl } from "@/lib/media-url";
import type { ProjectDetailDTO } from "@/lib/types";

// Sponsorship packages — priced tiers a brand can buy into. Each package shows
// its cover (when the editor picked one), its name, its price and the benefits
// it includes, plus an Exclusive mark (T23).
//
// Two rules this card has been through several rounds over (owner decisions,
// 2026-08-05) — keep them in mind before moving anything:
//
//   1. No cover means NO media area at all. A placeholder block was tried and
//      dropped: it filled a third of the card with grey for nothing.
//   2. Every card in a grid row must line up. That rules out anything that
//      only exclusive tiers render inside the text flow — an eyebrow row above
//      the name, or a chip sharing the name's line that makes long Armenian
//      names wrap. Both were tried; both pushed the price and the rule of
//      those cards a row lower than their neighbours.
//
// The mark therefore rides in the price row, which every card has and which is
// always exactly one line (the price is `whitespace-nowrap`, so a long figure
// cannot wrap and add height). It sits next to the money, which is where
// exclusivity actually means something to a buyer.
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
          <p className="mt-1 text-sm text-foreground/70">{t("investment.sponsorsSubtitle")}</p>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {project.tiers.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 0.05}>
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
                {tier.image ? (
                  <div className="relative aspect-video w-full bg-muted">
                    <Image
                      src={mediaUrl(tier.image)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    />
                  </div>
                ) : null}

                <div className="flex flex-1 flex-col p-7 max-sm:p-5">
                  {/* The exclusivity mark gets its own line ABOVE the name, and
                      that line is rendered on every card — `invisible` (not
                      absent) on the ones that aren't exclusive. That is the
                      whole trick, and it is deliberate: the mark is the only
                      thing on this card that some tiers have and others don't,
                      so anything that gives it space only when it is present
                      pushes that card's name, price and rule out of step with
                      its neighbours. Sharing the price's line was tried and it
                      is worse than it looks — the pair fits at 1280 and at
                      768, but not at 1024 (three columns in a narrower
                      container: 254px needed, 249px available), so it wrapped
                      on exactly one breakpoint and broke the row there. A
                      reserved line costs ~26px on every card and cannot break
                      at any width. `visibility: hidden` also keeps it out of
                      the accessibility tree, so nothing reads a phantom
                      "exclusive" on an ordinary package. */}
                  <span
                    className={`mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                      tier.isExclusive
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "invisible border-transparent"
                    }`}
                  >
                    <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-current" />
                    {t("report.exclusive")}
                  </span>
                  {/* Bigger and calmer than before — a regular weight at
                      display size reads as considered, not shouted. */}
                  {/* One step down on a phone — see the same note in
                      product-placements.tsx. */}
                  <h3 className="text-2xl font-normal tracking-tight text-foreground max-sm:text-xl">
                    {tier.name}
                  </h3>
                  {/* No price is a deliberate state, not a missing one. Price
                      is the dominant figure on the card, and it now has the
                      line to itself. */}
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground max-sm:text-2xl">
                    {tier.priceDisplay ?? (
                      <span className="text-base font-semibold text-foreground/80">
                        {t("report.priceOnRequest")}
                      </span>
                    )}
                  </p>
                  {/* The "X / Y slots free" line used to sit here. Removed from
                      the storefront cards on the owner's call (2026-08-05):
                      the same count already leads the hero's deal card for the
                      whole project, and repeating it per card turned every
                      offer into an inventory row. The numbers themselves are
                      untouched — availableSlots still gates the apply flow and
                      still shows in the deal card and the sticky bar. */}
                  {tier.benefits.length > 0 ? (
                    <>
                      <div className="mt-5 h-px bg-foreground/20" />
                      <ul className="mt-5 space-y-2 text-sm text-foreground/75">
                        {tier.benefits.map((b) => (
                          <li key={b} className="flex gap-2.5">
                            <span
                              aria-hidden
                              className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/45"
                            />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {/* Pinned to the card's bottom (mt-auto) so every card in a
                      row lines its button up on one edge regardless of how
                      long its benefits list is. */}
                  <div className="mt-auto pt-6">
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
