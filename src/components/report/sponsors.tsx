import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { OfferApplyButton } from "@/components/report/offer-apply-button";
import { offerValue } from "@/lib/offer-value";
import type { ProjectDetailDTO } from "@/lib/types";

// A tier that hasn't been given a cover in the media library still needs a
// considered header rather than an empty stub. A quiet roman numeral, in the
// same voice as the editorial covers editors pick from, fills that space
// without inventing copy that would need its own i18n keys.
function toRoman(num: number): string {
  const table: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let n = num;
  let out = "";
  for (const [value, sym] of table) {
    while (n >= value) {
      out += sym;
      n -= value;
    }
  }
  return out;
}

// Sponsorship packages — priced tiers a brand can buy into. Each package
// shows its price, its benefits list, and — when set on the tier — how many
// placements are still open ("X / Y") plus an Exclusive mark (T23).
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
                      src={tier.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    />
                  </div>
                ) : (
                  // No cover chosen in the media library yet — a quiet
                  // typographic header rather than a blank stub, echoing the
                  // numeral treatment of the editorial covers themselves.
                  <div className="relative flex aspect-video w-full items-end overflow-hidden bg-muted px-6 pb-5">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -top-8 right-0 select-none font-serif text-[8rem] leading-none text-muted-foreground/15"
                    >
                      {toRoman(i + 1)}
                    </span>
                    <div className="h-px w-8 bg-border" />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-7">
                  {/* The exclusivity mark is an eyebrow above the name, not a
                      chip beside it (owner request 2026-08-05). Two reasons:
                      it is the one thing on the card that has to be noticed
                      before the price, and sharing a row with the name squeezed
                      it — Armenian package names run long, and the h3 was
                      wrapping to make room for a badge three words wide.
                      The accent ring + tinted wash is what makes it read as a
                      seal on the card rather than another muted caption; the
                      rotated square is drawn, not an icon import. */}
                  {tier.isExclusive ? (
                    <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                      <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-primary" />
                      {t("report.exclusive")}
                    </span>
                  ) : null}
                  {/* Bigger and calmer than before — a regular weight at
                      display size reads as considered, not shouted. */}
                  <h3 className="text-2xl font-normal tracking-tight text-foreground">
                    {tier.name}
                  </h3>
                  {/* No price is a deliberate state, not a missing one. Price
                      is the dominant figure on the card — bigger and heavier
                      than the name above it. */}
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
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
