import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { adChannelsByGroup } from "@/lib/ad-channels";
import { ADS_ENABLED } from "@/lib/feature-flags";
import { makeUI } from "@/lib/i18n";
import { AD_CHANNEL_ICONS } from "./channel-icons";

// Canonical dropped while the section is off (same rule as /portfolio) —
// nothing should point at a route that 404s.
export const metadata: Metadata = ADS_ENABLED
  ? {
      title: "Advertising Channels — iGovazd",
      description:
        "Product placement, event sponsorship, TV, radio, video, banner, billboard, lift and transit advertising — all nine channels in one place.",
      alternates: { canonical: "/ads" },
    }
  : {};

export default async function AdsPage() {
  if (!ADS_ENABLED) notFound();

  const locale = await getLocale();
  const currency = await getCurrency();
  const t = makeUI(locale);

  return (
    <>
      <SiteHeader />

      <PageHero
        eyebrow={t("ads.hero.eyebrow")}
        title={t("ads.hero.title")}
        subtitle={t("ads.hero.subtitle")}
        locale={locale}
        primaryCta={{ label: t("ads.hero.ctaBrowse"), href: "/catalog" }}
        secondaryCta={{ label: t("ads.hero.ctaContact"), href: "/contact" }}
      />

      <Section>
        <Container>
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("ads.groupsTitle")}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-3 max-w-3xl text-muted-foreground">{t("ads.groupsSubtitle")}</p>
          </Reveal>

          <div className="mt-12 space-y-14">
            {adChannelsByGroup().map(({ group, channels }, groupIdx) => (
              <Reveal key={group} delay={0.15 + groupIdx * 0.06}>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t(`adGroup.${group}`)}
                  </h3>
                  <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {channels.map((channel) => {
                      const Icon = AD_CHANNEL_ICONS[channel.code];
                      return (
                        <Link
                          key={channel.code}
                          href={`/ads/${channel.slug}`}
                          className="flex h-full flex-col rounded-2xl border border-border bg-card p-8 card-lift"
                        >
                          <div className="flex items-center gap-3">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="text-lg font-semibold text-foreground">
                              {t(`adChannel.${channel.code}`)}
                            </span>
                          </div>
                          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                            {t(`adChannel.${channel.code}.desc`)}
                          </p>
                          {/* Placement belongs to Content Integration AND
                              Sponsorship in the director's table; it is listed
                              once, under Content, and says so here rather than
                              appearing twice (see AdChannel.alsoSponsorship). */}
                          {channel.alsoSponsorship ? (
                            <span className="mt-4 self-start rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {t("adGroup.SPONSORSHIP")}
                            </span>
                          ) : null}
                          <span className="mt-auto flex items-center gap-1.5 pt-6 text-sm font-medium text-primary">
                            {t("ads.channelCta")}
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <div className="mx-auto max-w-2xl">
            <Reveal>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-8 py-12 text-center">
                <h2 className="text-2xl font-bold text-foreground">{t("ads.cta.title")}</h2>
                <p className="mt-4 text-muted-foreground">{t("ads.cta.subtitle")}</p>
                <div className="mt-8 flex justify-center">
                  <Button asChild variant="primary" size="md">
                    <Link href="/contact">{t("ads.cta.button")}</Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Footer locale={locale} currency={currency} />
    </>
  );
}
