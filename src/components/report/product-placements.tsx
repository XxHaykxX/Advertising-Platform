import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
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
          <p className="mt-1 text-sm text-muted-foreground">{t("report.placementsSubtitle")}</p>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                      unoptimized
                    />
                  </div>
                ) : null}

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
                  {/* No price is a deliberate state, not a missing one. */}
                  <p className="mt-1 text-xl font-extrabold text-foreground">
                    {p.priceDisplay ?? (
                      <span className="text-base font-semibold text-muted-foreground">
                        {t("report.priceOnRequest")}
                      </span>
                    )}
                  </p>
                  {p.totalSlots != null && p.totalSlots > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.availableSlots ?? 0} / {p.totalSlots} {t("report.slotsAvailable")}
                    </p>
                  ) : null}
                  {p.description.length > 0 ? (
                    <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                      {p.description.map((line) => (
                        <li key={line}>• {line}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
