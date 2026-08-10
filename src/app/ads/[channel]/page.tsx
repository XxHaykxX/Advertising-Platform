import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { ProjectCard } from "@/components/project-card";
import { AdSpaceCard } from "@/components/ad-space-card";
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

const BUY_KEYS = ["buy1", "buy2", "buy3"] as const;

// The inventory grid here is a teaser (2026-08-10, stage B) — the catalog is
// where browsing/filtering/sorting actually happens now.
const TEASER_SIZE = 6;

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
  // Favorites (#22) are a BRAND-only private shortlist — same rule as /catalog.
  const favorites =
    currentUser != null && canBuy(currentUser)
      ? await getBrandFavoriteSet(currentUser.id)
      : new Set<number>();
  // Nobody buys from themselves — same rule as /catalog.
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
          channel.entity === "PROJECT"
            ? { label: t("ads.hero.ctaBrowse"), href: "#inventory" }
            : { label: t("ads.hero.ctaContact"), href: "/contact" }
        }
        secondaryCta={{ label: t("ads.backToAll"), href: "/ads" }}
      />

      {/* What this is */}
      <Section>
        <Container>
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {t("ads.about.title")}
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-6 max-w-3xl leading-relaxed text-muted-foreground">
              {t(`adChannel.${channel.code}.about`)}
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* What you can buy */}
      <Section muted>
        <Container>
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("ads.buy.title")}
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {BUY_KEYS.map((suffix, idx) => (
              <Reveal key={suffix} delay={0.1 + idx * 0.08}>
                <div className="flex h-full gap-3 rounded-2xl border border-border bg-card p-8">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm leading-relaxed text-foreground">
                    {t(`adChannel.${channel.code}.${suffix}`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Inventory */}
      <Section id="inventory">
        <Container>
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("ads.inventory.title")}
            </h2>
          </Reveal>

          {channel.entity === "PROJECT" ? (
            <>
              <Reveal delay={0.08}>
                <p className="mt-3 max-w-3xl text-muted-foreground">
                  {t("ads.inventory.projectsSubtitle")}
                </p>
              </Reveal>
              {projects.length > 0 ? (
                <>
                  <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.slice(0, TEASER_SIZE).map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        locale={locale}
                        favorited={favorites.has(project.id)}
                        canFavorite={canBuy(currentUser) && !ownIds.has(project.id)}
                        isOwn={ownIds.has(project.id)}
                        signedIn={currentUser !== null}
                      />
                    ))}
                  </div>
                  <div className="mt-8">
                    <Button asChild variant="secondary" size="md">
                      <Link href={`/catalog?channel=${channel.code}`}>{t("ads.viewAllInCatalog")}</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <Reveal delay={0.16}>
                  <p className="mt-8 max-w-3xl rounded-2xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground">
                    {t("ads.inventory.noProjects")}
                  </p>
                </Reveal>
              )}
            </>
          ) : spaces.length > 0 ? (
            /* The spaces creators have listed on this channel and moderation
               has approved (stage 3) — first TEASER_SIZE, same as the PROJECT
               branch above; the catalog is where the whole list lives now. */
            <>
              <Reveal delay={0.08}>
                <p className="mt-3 max-w-3xl text-muted-foreground">
                  {t("adSpacePublic.inventorySubtitle")}
                </p>
              </Reveal>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {spaces.slice(0, TEASER_SIZE).map((space) => (
                  <AdSpaceCard
                    key={space.id}
                    space={space}
                    channelSlug={channel.slug}
                    locale={locale}
                  />
                ))}
              </div>
              <div className="mt-8">
                <Button asChild variant="secondary" size="md">
                  <Link href={`/catalog?channel=${channel.code}`}>{t("ads.viewAllInCatalog")}</Link>
                </Button>
              </div>
            </>
          ) : (
            /* Nobody has listed anything on this channel yet — the honest
               state, kept from stage 2 rather than showing an empty grid. */
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
          )}

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

      <Footer locale={locale} currency={currency} />
    </>
  );
}
