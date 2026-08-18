import { Clock } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { CallRequestForm } from "@/components/call-request-form";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";

/* The page's closing ask: send a brief, get a quote within 24 hours.
   `id="callback"` is what the hero's second button scrolls to — the form is
   here rather than in a dialog on purpose, so the button is a plain anchor and
   there is no portal, no scroll lock and no focus trap to get wrong. */
export function HomeCta({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = makeUI(locale);

  // `muted` keeps the light/tinted alternation running now that the goals
  // section sits above on the plain background.
  return (
    <Section id="callback" muted>
      <Container>
        <div className="overflow-hidden rounded-3xl border border-border bg-[#0b0b14] px-6 py-14 sm:px-12 md:py-16">
          {/* Same indigo glow the hero opens on — the page closes on the note
              it started with. Decorative only, hence aria-hidden by way of
              being an empty div behind the content. */}
          <div className="relative isolate">
            <div className="pointer-events-none absolute -inset-x-24 -top-32 -z-10 h-[28rem] bg-[radial-gradient(ellipse_50%_60%_at_50%_40%,rgba(79,70,229,0.28),transparent_70%)]" />

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
              <Reveal>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                    {t("homeCta.title")}
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-white/70">
                    {t("homeCta.body")}
                  </p>
                  <p className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white">
                    <Clock className="h-4 w-4 shrink-0" />
                    {t("homeCta.within24h")}
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <div className="rounded-2xl bg-card p-6 sm:p-8">
                  <CallRequestForm locale={locale} />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
