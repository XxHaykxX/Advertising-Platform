import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "How It Works — iGovazd",
  description:
    "Explore how iGovazd connects brands with filmmakers. Browse projects anonymously, express interest, and close authentic placements.",
  alternates: { canonical: "/how-it-works" },
};

interface Step {
  number: number;
  titleKey: string;
  descKey: string;
}

const brandsSteps: Step[] = [
  { number: 1, titleKey: "hiw.brand1Title", descKey: "hiw.brand1Desc" },
  { number: 2, titleKey: "hiw.brand2Title", descKey: "hiw.brand2Desc" },
  { number: 3, titleKey: "hiw.brand3Title", descKey: "hiw.brand3Desc" },
  { number: 4, titleKey: "hiw.brand4Title", descKey: "hiw.brand4Desc" },
];

const filmmakerSteps: Step[] = [
  { number: 1, titleKey: "hiw.film1Title", descKey: "hiw.film1Desc" },
  { number: 2, titleKey: "hiw.film2Title", descKey: "hiw.film2Desc" },
  { number: 3, titleKey: "hiw.film3Title", descKey: "hiw.film3Desc" },
  { number: 4, titleKey: "hiw.film4Title", descKey: "hiw.film4Desc" },
];

export default async function HowItWorksPage() {
  const locale = await getLocale();
  const t = makeUI(locale);

  return (
    <>
      <Header locale={locale} />

      {/* Hero section */}
      <Section className="border-b border-border">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <h1 className="text-5xl font-bold md:text-6xl">{t("hiw.heroTitle")}</h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 text-lg text-muted-foreground">
                {t("hiw.heroSubtitle")}
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Two-column steps section */}
      <Section>
        <Container>
          <div className="grid gap-16 lg:grid-cols-2">
            {/* For Brands */}
            <div>
              <Reveal>
                <h2 className="text-2xl font-bold text-foreground">{t("hiw.forBrandsTitle")}</h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("hiw.forBrandsSubtitle")}
                </p>
              </Reveal>

              <div className="mt-8 space-y-8">
                {brandsSteps.map((step, idx) => (
                  <Reveal key={step.number} delay={0.15 + idx * 0.08}>
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                        {step.number}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{t(step.titleKey)}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{t(step.descKey)}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* For Filmmakers */}
            <div>
              <Reveal>
                <h2 className="text-2xl font-bold text-foreground">{t("hiw.forFilmmakersTitle")}</h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("hiw.forFilmmakersSubtitle")}
                </p>
              </Reveal>

              <div className="mt-8 space-y-8">
                {filmmakerSteps.map((step, idx) => (
                  <Reveal key={step.number} delay={0.15 + idx * 0.08}>
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                        {step.number}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{t(step.titleKey)}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{t(step.descKey)}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Trust & CTA section */}
      <Section muted>
        <Container>
          <div className="mx-auto max-w-2xl">
            <Reveal>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-8 py-12 text-center">
                <h2 className="text-2xl font-bold text-foreground">{t("hiw.trustTitle")}</h2>
                <p className="mt-4 text-muted-foreground">
                  {t("hiw.trustBody")}
                </p>

                <div className="mt-8 flex justify-center">
                  <Button asChild variant="primary" size="md">
                    <Link href="/catalog">{t("btn.browseProjects")}</Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Footer locale={locale} />
    </>
  );
}
