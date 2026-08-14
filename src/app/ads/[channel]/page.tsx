import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { getProjects } from "@/lib/data/projects";
import { getAdSpacesByChannel } from "@/lib/data/ad-spaces";
import { getBrandFavoriteSet, getOwnedProjectIdSet } from "@/lib/data/favorites";
import { loadCurrentUser } from "@/lib/auth/require";
import { canBuy, canSell } from "@/lib/auth/capabilities";
import { AD_CHANNELS, findAdChannel, type AdChannel } from "@/lib/ad-channels";
import { ADS_ENABLED } from "@/lib/feature-flags";
import { makeUI } from "@/lib/i18n";
import type { ProjectListDTO } from "@/lib/types";
import { AD_CHANNEL_ICONS } from "../channel-icons";
import { AdsView, type CatalogRow } from "../ads-view";
import { projectToRow, spaceToRow } from "../rows";

/** English metadata, like every other public page here (the site is noindex
 *  anyway — this is what a shared link unfurls as). Canonical is dropped for
 *  an unknown slug and while the section is off, same rule as /portfolio. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ channel: string }>;
}): Promise<Metadata> {
  const { channel: slug } = await params;
  const channel = findAdChannel(slug);
  if (!channel || !ADS_ENABLED) return {};
  const en = makeUI("en");
  return {
    title: `${en(`adChannel.${channel.code}`)} — iGovazd`,
    description: en(`adChannel.${channel.code}.desc`),
    alternates: { canonical: `/ads/${channel.slug}` },
  };
}

export async function generateStaticParams() {
  return AD_CHANNELS.map((c) => ({ channel: c.slug }));
}

/** Which existing projects count as this channel's inventory. Only the two
 *  PROJECT channels get here; the seven AD_SPACE ones have no table yet
 *  (stage 3). Placement sells `Placement` rows, event sponsorship sells
 *  `SponsorshipTier` rows — the two counters the list DTO already carries, so
 *  no new query and no new data layer. */
function channelProjects(channel: AdChannel, projects: ProjectListDTO[]): ProjectListDTO[] {
  if (channel.code === "PLACEMENT") return projects.filter((p) => p.placementsCount > 0);
  return projects.filter((p) => p.tiersCount > 0);
}

export default async function AdChannelPage({
  params,
}: {
  params: Promise<{ channel: string }>;
}) {
  if (!ADS_ENABLED) notFound();

  const { channel: slug } = await params;
  const channel = findAdChannel(slug);
  if (!channel) notFound();

  const locale = await getLocale();
  const currency = await getCurrency();
  const t = makeUI(locale);
  const Icon = AD_CHANNEL_ICONS[channel.code];

  // Each entity kind queries only its own table: a PROJECT channel never
  // touches AdSpace and vice versa.
  const currentUser = channel.entity === "PROJECT" ? await loadCurrentUser() : null;
  const projects =
    channel.entity === "PROJECT"
      ? channelProjects(channel, await getProjects(locale, currency))
      : [];
  // Approved, visible spaces only — the gate lives in getAdSpacesByChannel.
  const spaces =
    channel.entity === "AD_SPACE" ? await getAdSpacesByChannel(channel.code, locale, currency) : [];
  // Same row shape /ads builds its full list from (ads/rows.ts) — this
  // channel's slice of it (2026-08-14, stage 1: the teaser grid + "view all
  // in catalog" button became the actual list, filters and all).
  const rows: CatalogRow[] =
    channel.entity === "PROJECT"
      ? projects.map(projectToRow)
      : spaces.flatMap((s) => {
          const row = spaceToRow(s, t);
          return row ? [row] : [];
        });
  // Favorites (#22) are a BRAND-only private shortlist — same rule as /ads.
  const favorites =
    currentUser != null && canBuy(currentUser)
      ? await getBrandFavoriteSet(currentUser.id)
      : new Set<number>();
  // Nobody buys from themselves — same rule as /ads.
  const ownIds =
    currentUser != null && canSell(currentUser)
      ? await getOwnedProjectIdSet(currentUser.id)
      : new Set<number>();

  return (
    <>
      <SiteHeader />

      <PageHero
        eyebrow={t(`adGroup.${channel.group}`)}
        title={t(`adChannel.${channel.code}`)}
        subtitle={t(`adChannel.${channel.code}.desc`)}
        locale={locale}
        primaryCta={
          rows.length > 0
            ? { label: t("ads.hero.ctaBrowse"), href: "#inventory" }
            : { label: t("ads.hero.ctaContact"), href: "/contact" }
        }
        secondaryCta={{ label: t("ads.allListings"), href: "/ads" }}
      />

      {/* Inventory — the channel's own slice of /ads, filters and all. Empty
          state (no rows) keeps the "coming soon" block from before rather
          than an AdsView with nothing to filter. */}
      {rows.length > 0 ? (
        <div id="inventory">
          <AdsView
            rows={rows}
            locale={locale}
            currency={currency}
            favorites={favorites}
            ownIds={ownIds}
            signedIn={currentUser !== null}
            isBrand={canBuy(currentUser)}
            mode="channel"
            channelCode={channel.code}
          />
        </div>
      ) : (
        <Section id="inventory">
          <Container>
            <Reveal>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  {t("ads.inventory.title")}
                </h2>
              </div>
            </Reveal>
            {/* Nobody has listed anything on this channel yet — the honest
                state, kept from stage 2 rather than showing an empty grid. */}
            <Reveal delay={0.08}>
              <div className="mt-8 max-w-3xl rounded-2xl border border-dashed border-border bg-card px-8 py-10">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground">{t("ads.inventory.soonTitle")}</h3>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {t("ads.inventory.soonBody")}
                </p>
                <div className="mt-8">
                  <Button asChild variant="primary" size="md">
                    <Link href="/contact">{t("ads.cta.button")}</Link>
                  </Button>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-12">
                <Link
                  href="/ads"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-opacity hover:opacity-80"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("ads.backToAll")}
                </Link>
              </div>
            </Reveal>
          </Container>
        </Section>
      )}

      <Footer locale={locale} currency={currency} />
    </>
  );
}
