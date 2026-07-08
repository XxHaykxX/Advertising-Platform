import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { PartnersMarquee } from "@/components/partners-page/partners-marquee";
import { PartnersGrid } from "@/components/partners-page/partners-grid";
import { PartnersCta } from "@/components/partners-page/partners-cta";
import { getPartners } from "@/lib/data/partners";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export const metadata = {
  title: "Partners — FP Placement",
  description:
    "The production studios and distribution networks that trust FP Placement to connect their projects with brand partners.",
  alternates: { canonical: "/partners" },
};

export default async function PartnersPage() {
  const [partners, locale] = await Promise.all([getPartners(), getLocale()]);
  const t = makeUI(locale);

  return (
    <>
      <Header locale={locale} />
      <main className="relative min-h-screen bg-background">
        {/* Intro */}
        <div className="border-b border-border/50 bg-gradient-to-b from-background to-background/50 py-12 sm:py-16">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <Reveal>
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  {t("partners.title")}
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-4 text-lg text-muted-foreground">
                  {t("partners.subtitle")}
                </p>
              </Reveal>
            </div>
          </Container>
        </div>

        {/* Continuous logo marquee (full-bleed, edge-faded) */}
        <Section>
          <Reveal>
            <PartnersMarquee partners={partners} />
          </Reveal>
        </Section>

        {/* Static grid with taglines */}
        <Section muted>
          <Container>
            <div className="mb-12 text-center">
              <Reveal>
                <h2 className="text-3xl font-bold md:text-4xl">{t("partners.fullNetwork")}</h2>
              </Reveal>
            </div>
            <PartnersGrid partners={partners} />
          </Container>
        </Section>

        <PartnersCta locale={locale} />
      </main>
      <Footer locale={locale} />
    </>
  );
}
