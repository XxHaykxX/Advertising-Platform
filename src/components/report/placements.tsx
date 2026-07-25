import { AccentBadge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectDetailDTO } from "@/lib/types";

// Sponsorship tiers (#20²) — priced packages a brand can buy into. Each tier
// shows its price, its benefits list, and — when set on the tier — how many
// placements are still open ("X / Y") plus an Exclusive badge (T23).
export function Placements({
  project,
  locale = DEFAULT_LOCALE,
}: {
  project: ProjectDetailDTO;
  locale?: Locale;
}) {
  if (project.tiers.length === 0) return null;
  const t = makeUI(locale);

  return (
    <section id="placements" className="py-10">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <Reveal>
          <h2 className="text-2xl font-bold text-foreground">{t("investment.sponsorsTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("investment.sponsorsSubtitle")}</p>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {project.tiers.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 0.05}>
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                  {tier.isExclusive ? <AccentBadge>{t("report.exclusive")}</AccentBadge> : null}
                </div>
                <p className="mt-1 text-xl font-extrabold text-foreground">{tier.priceDisplay}</p>
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
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
