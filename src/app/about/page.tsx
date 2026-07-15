import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Clapperboard, Sparkles, Scale, EyeOff, Handshake } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { AboutHero } from "@/components/about-page/about-hero";
import { PartnersMarquee } from "@/components/partners-page/partners-marquee";
import { PartnersGrid } from "@/components/partners-page/partners-grid";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { getPartners } from "@/lib/data/partners";
import { makeUI } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "About us — iGovazd",
  description:
    "iGovazd is a marketplace connecting brands with film and content creators for authentic product placement.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [locale, currency, partners] = await Promise.all([
    getLocale(),
    getCurrency(),
    getPartners(),
  ]);
  const t = makeUI(locale);

  const pillars = [
    { icon: Scale, title: t("about.pillar1Title"), body: t("about.pillar1Body") },
    { icon: EyeOff, title: t("about.pillar2Title"), body: t("about.pillar2Body") },
    { icon: Handshake, title: t("about.pillar3Title"), body: t("about.pillar3Body") },
  ];

  return (
    <>
      <SiteHeader />

      <AboutHero locale={locale} />

      {/* ── Mission — oversized editorial statement ───────────── */}
      <Section>
        <Container>
          <div className="mx-auto max-w-4xl">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                {t("about.missionTitle")}
              </p>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-5 text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-4xl md:text-[2.75rem]">
                {t("about.missionBody")}
              </h2>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── How we connect — brands ⇄ placement ⇄ creators ────── */}
      <Section muted>
        <Container>
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("about.connectTitle")}
            </h2>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-5xl items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
            {/* Brands */}
            <Reveal>
              <div className="card-lift flex h-full flex-col rounded-2xl border border-border bg-card p-8">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Megaphone className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-foreground">
                  {t("about.forBrandsTitle")}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t("about.forBrandsBody")}
                </p>
              </div>
            </Reveal>

            {/* Center placement node */}
            <Reveal delay={0.08}>
              <div className="flex h-full flex-col items-center justify-center gap-3 py-2 md:py-0">
                <span className="hidden h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent md:block" />
                <div className="grid place-items-center">
                  <span className="placement-glow inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                    {t("about.placementBadge")}
                  </span>
                </div>
                <span className="hidden h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent md:block" />
              </div>
            </Reveal>

            {/* Creators */}
            <Reveal delay={0.16}>
              <div className="card-lift flex h-full flex-col rounded-2xl border border-border bg-card p-8">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Clapperboard className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-foreground">
                  {t("about.forCreatorsTitle")}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t("about.forCreatorsBody")}
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ── Pillars — why iGovazd ─────────────────────────────── */}
      <Section>
        <Container>
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("about.pillarsTitle")}
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {pillars.map((p, idx) => (
              <Reveal key={p.title} delay={0.08 * idx}>
                <div className="card-lift group h-full rounded-2xl border border-border bg-card p-8">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <p.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">{p.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Network — production studios & distribution partners ─ */}
      {partners.length > 0 ? (
        <div className="border-t border-border bg-section py-16 sm:py-20">
          <Container>
            <Reveal>
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  {t("partners.fullNetwork")}
                </h2>
                <p className="mt-3 text-base text-muted-foreground">{t("partners.subtitle")}</p>
              </div>
            </Reveal>
          </Container>
          <div className="mb-12">
            <PartnersMarquee partners={partners} />
          </div>
          <Container>
            <PartnersGrid partners={partners} />
          </Container>
        </div>
      ) : null}

      {/* ── CTA ───────────────────────────────────────────────── */}
      <Section>
        <Container>
          <Reveal>
            <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 px-8 py-14 text-center">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
              <h2 className="relative text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t("about.ctaTitle")}
              </h2>
              <p className="relative mt-4 text-muted-foreground">{t("about.ctaBody")}</p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild variant="primary" size="md">
                  <Link href="/catalog">{t("btn.browseProjects")}</Link>
                </Button>
                <Button asChild variant="secondary" size="md">
                  <Link href="/register">{t("about.registerCta")}</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      <Footer locale={locale} currency={currency} />
    </>
  );
}
