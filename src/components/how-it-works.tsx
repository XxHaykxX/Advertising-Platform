import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";

interface Step {
  number: number;
  title: string;
  caption: string;
}

export default function HowItWorks({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = makeUI(locale);

  const brandsSteps: Step[] = [
    { number: 1, title: t("landingHow.brand1Title"), caption: t("landingHow.brand1Caption") },
    { number: 2, title: t("landingHow.brand2Title"), caption: t("landingHow.brand2Caption") },
    { number: 3, title: t("landingHow.brand3Title"), caption: t("landingHow.brand3Caption") },
  ];

  const filmmakerSteps: Step[] = [
    { number: 1, title: t("landingHow.film1Title"), caption: t("landingHow.film1Caption") },
    { number: 2, title: t("landingHow.film2Title"), caption: t("landingHow.film2Caption") },
    { number: 3, title: t("landingHow.film3Title"), caption: t("landingHow.film3Caption") },
  ];

  return (
    <Section id="how-it-works">
      <Container>
        <div className="mb-16 text-center">
          <Reveal>
            <h2 className="text-4xl font-bold md:text-5xl">{t("landingHow.title")}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("landingHow.subtitle")}
            </p>
          </Reveal>
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* Two-column flow */}
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            {/* For Brands */}
            <div className="space-y-8">
              <Reveal delay={0.2}>
                <h3 className="text-lg font-semibold text-foreground">{t("landingHow.forBrands")}</h3>
              </Reveal>
              {brandsSteps.map((step, idx) => (
                <Reveal key={step.number} delay={0.2 + (idx + 1) * 0.1}>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {step.number}
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{step.caption}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* For Filmmakers */}
            <div className="space-y-8">
              <Reveal delay={0.2}>
                <h3 className="text-lg font-semibold text-foreground">{t("landingHow.forCreators")}</h3>
              </Reveal>
              {filmmakerSteps.map((step, idx) => (
                <Reveal key={step.number} delay={0.2 + (idx + 1) * 0.1}>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {step.number}
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{step.caption}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* The converging "Matching & Deal" card that used to sit here was
              removed on the owner's request (2026-08-05). It restated what the
              two columns above already say and ended the section on a claim
              rather than on an action — the two ladders now close the block
              themselves. The landingHow.matchTitle / matchCaption keys are
              left in the dictionary: they cost nothing and Мариам edits that
              file through /admin/i18n, where a disappearing row reads as data
              loss. */}
        </div>
      </Container>
    </Section>
  );
}
