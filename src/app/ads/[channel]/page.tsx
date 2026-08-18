import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Megaphone } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { getBrandFavoriteSet, getOwnedProjectIdSet } from "@/lib/data/favorites";
import { loadCurrentUser } from "@/lib/auth/require";
import { canBuy, canSell } from "@/lib/auth/capabilities";
import {
  AD_CHANNELS,
  AD_CHANNEL_GROUPS,
  AD_GROUP_SLUGS,
  adGroupChannelCodes,
  findAdChannel,
  findAdGroup,
  type AdChannelGroup,
} from "@/lib/ad-channels";
import { ADS_ENABLED } from "@/lib/feature-flags";
import { makeUI } from "@/lib/i18n";
import { AD_CHANNEL_ICONS } from "../channel-icons";
import { AdsView, type CatalogRow } from "../ads-view";
import { loadCatalogRows } from "../rows";

/* One flat namespace, two levels: /ads/outdoor is a group (every billboard,
   lift and transit listing at once, with a channel switcher) and
   /ads/billboard is a single channel. A channel wins the lookup, and
   ad-channels.test.ts pins the two slug sets as disjoint so a new group can
   never shadow a channel page.

   The nested alternative (/ads/<group>/<channel>) was rejected: the second
   segment already belongs to an ad space's code, and adSpacePath() — which
   letters, emails and admin moderation all build links with — would have had
   to grow a level. */

type Target =
  | { kind: "group"; group: AdChannelGroup; codes: string[]; slug: string }
  | { kind: "channel"; code: string; group: AdChannelGroup; codes: string[]; slug: string };

function resolveTarget(slug: string): Target | null {
  const channel = findAdChannel(slug);
  if (channel) {
    return {
      kind: "channel",
      code: channel.code,
      group: channel.group,
      codes: [channel.code],
      slug: channel.slug,
    };
  }
  const group = findAdGroup(slug);
  if (group) {
    return { kind: "group", group, codes: adGroupChannelCodes(group), slug: AD_GROUP_SLUGS[group] };
  }
  return null;
}

/** The dictionary keys a target titles itself with — a channel names itself,
 *  a group names itself, and both carry a one-line description. */
function labelKeys(target: Target) {
  return target.kind === "channel"
    ? { title: `adChannel.${target.code}`, desc: `adChannel.${target.code}.desc` }
    : { title: `adGroup.${target.group}`, desc: `adGroup.${target.group}.desc` };
}

/** English metadata, like every other public page here (the site is noindex
 *  anyway — this is what a shared link unfurls as). Canonical is dropped for
 *  an unknown slug and while the section is off, same rule as /portfolio. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ channel: string }>;
}): Promise<Metadata> {
  const { channel: slug } = await params;
  const target = resolveTarget(slug);
  if (!target || !ADS_ENABLED) return {};
  const en = makeUI("en");
  const keys = labelKeys(target);
  return {
    title: `${en(keys.title)} — iGovazd`,
    description: en(keys.desc),
    alternates: { canonical: `/ads/${target.slug}` },
  };
}

export async function generateStaticParams() {
  return [
    ...AD_CHANNEL_GROUPS.map((g) => ({ channel: AD_GROUP_SLUGS[g] })),
    ...AD_CHANNELS.map((c) => ({ channel: c.slug })),
  ];
}

export default async function AdSectionPage({
  params,
}: {
  params: Promise<{ channel: string }>;
}) {
  if (!ADS_ENABLED) notFound();

  const { channel: slug } = await params;
  const target = resolveTarget(slug);
  if (!target) notFound();

  const locale = await getLocale();
  const currency = await getCurrency();
  const t = makeUI(locale);
  const keys = labelKeys(target);
  // A group has no icon of its own — the empty state borrows the first
  // channel's, which is the one a visitor just clicked through.
  const Icon = AD_CHANNEL_ICONS[target.kind === "channel" ? target.code : target.codes[0]] ?? Megaphone;

  // Favorites and ownership only mean anything where projects are sold, so the
  // two extra queries are skipped entirely on an ad-space-only section.
  const sellsProjects = target.codes.some((c) => c === "PLACEMENT" || c === "EVENTS");
  const currentUser = sellsProjects ? await loadCurrentUser() : null;
  const rows: CatalogRow[] = await loadCatalogRows(target.codes, locale, currency, t);
  // Favorites (#22) are a BRAND-only private shortlist.
  const favorites =
    currentUser != null && canBuy(currentUser)
      ? await getBrandFavoriteSet(currentUser.id)
      : new Set<number>();
  // Nobody buys from themselves.
  const ownIds =
    currentUser != null && canSell(currentUser)
      ? await getOwnedProjectIdSet(currentUser.id)
      : new Set<number>();

  // Where "back" goes: a channel steps up to its group, a group steps out to
  // the homepage section the four cards live in.
  const backHref = target.kind === "channel" ? `/ads/${AD_GROUP_SLUGS[target.group]}` : "/#ad-types";
  const backLabel =
    target.kind === "channel" ? t(`adGroup.${target.group}`) : t("ads.backToTypes");

  return (
    <>
      <SiteHeader />

      <PageHero
        eyebrow={target.kind === "channel" ? t(`adGroup.${target.group}`) : t("nav.ads")}
        title={t(keys.title)}
        subtitle={t(keys.desc)}
        locale={locale}
        primaryCta={
          rows.length > 0
            ? { label: t("ads.hero.ctaBrowse"), href: "#inventory" }
            : { label: t("ads.hero.ctaContact"), href: "/contact" }
        }
        secondaryCta={{ label: backLabel, href: backHref }}
      />

      {/* Inventory — filters and all. On a group page AdsView also offers the
          Channel facet as a switcher between the group's channels. Empty state
          (no rows) keeps the "coming soon" block rather than an AdsView with
          nothing to filter. */}
      {rows.length > 0 ? (
        <div id="inventory">
          <AdsView
            rows={rows}
            channelCodes={target.codes}
            locale={locale}
            favorites={favorites}
            ownIds={ownIds}
            signedIn={currentUser !== null}
            isBrand={canBuy(currentUser)}
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
            {/* Nobody has listed anything here yet — the honest state, kept
                from stage 2 rather than showing an empty grid. */}
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
                  href={backHref}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-opacity hover:opacity-80"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {backLabel}
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
