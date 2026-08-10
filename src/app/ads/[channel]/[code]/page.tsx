import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarRange, Eye, Layers, MapPin, Ruler } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { PosterSlider } from "@/components/report/poster-slider";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { getAdSpace } from "@/lib/data/ad-spaces";
import { formatFullDate } from "@/lib/data/format";
import { adSpaceCodeFromSlug } from "@/lib/ad-space-url";
import { findAdChannel } from "@/lib/ad-channels";
import { ADS_ENABLED } from "@/lib/feature-flags";
import { DEFAULT_LOCALE, intlLocale, makeUI, type Locale } from "@/lib/i18n";
import type { AdSpaceDetailDTO } from "@/lib/types";

/* The public card of one advertising space (stage 3,
   docs/plan-multichannel-ads.md). Laid out like /reports/[id] — a light hero
   with the images and the facts side by side, then the offers — rather than
   the dark PageHero the channel pages use: this page is a listing, and the
   header only goes transparent-on-dark for the paths in DARK_HERO_PATHS.

   No application button here. Applications on ad spaces are stage 4 (they need
   Interest.adSpaceId), so every CTA points at /contact instead of publishing a
   button that would go nowhere. */

/** The route param is the code WITHOUT its leading "#" — see
 *  src/lib/ad-space-url.ts. Returns null for anything the visitor may not see:
 *  an unknown slug, a code that never cleared moderation (getAdSpace's own
 *  gate), or a real space reached through the wrong channel's URL. */
async function loadSpace(
  slug: string,
  code: string,
  locale: Locale,
  currency: Awaited<ReturnType<typeof getCurrency>>,
): Promise<{ space: AdSpaceDetailDTO; channelCode: string } | null> {
  const channel = findAdChannel(slug);
  if (!channel || channel.entity !== "AD_SPACE") return null;
  const space = await getAdSpace(adSpaceCodeFromSlug(code), locale, currency);
  if (!space || space.channel !== channel.code) return null;
  return { space, channelCode: channel.code };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ channel: string; code: string }>;
}): Promise<Metadata> {
  const { channel: slug, code } = await params;
  if (!ADS_ENABLED) return {};
  // English metadata like every other public page — the site is noindex, this
  // is what a shared link unfurls as. The title itself is content, so it comes
  // out of the DB in the site's default language.
  const found = await loadSpace(slug, code, DEFAULT_LOCALE, "AMD");
  if (!found) return {};
  const en = makeUI("en");
  return {
    title: `${found.space.title} — ${en(`adChannel.${found.channelCode}`)} — iGovazd`,
    description: found.space.description[0] ?? en(`adChannel.${found.channelCode}.desc`),
    alternates: { canonical: `/ads/${slug}/${code}` },
  };
}

export default async function AdSpacePage({
  params,
}: {
  params: Promise<{ channel: string; code: string }>;
}) {
  if (!ADS_ENABLED) notFound();

  const { channel: slug, code } = await params;
  const locale = await getLocale();
  const currency = await getCurrency();
  const found = await loadSpace(slug, code, locale, currency);
  if (!found) notFound();
  const { space, channelCode } = found;
  const t = makeUI(locale);

  // Main photo first, then the gallery, de-duplicated in case the same file
  // sits in both fields — same rule as the report hero's slider.
  const images = Array.from(new Set([space.image, ...space.gallery].filter(Boolean)));

  const availability = space.availableFrom
    ? space.availableTo
      ? t("adSpacePublic.availableRange", {
          from: formatFullDate(space.availableFrom, intlLocale(locale)),
          to: formatFullDate(space.availableTo, intlLocale(locale)),
        })
      : t("adSpacePublic.availableFrom", {
          date: formatFullDate(space.availableFrom, intlLocale(locale)),
        })
    : space.availableTo
      ? t("adSpacePublic.availableTo", {
          date: formatFullDate(space.availableTo, intlLocale(locale)),
        })
      : "";

  // Each fact carries its own label and drops out when the owner left it
  // empty — a label above nothing reads worse than a shorter card.
  const facts = [
    { icon: MapPin, label: t("adSpacePublic.location"), value: space.location },
    { icon: Ruler, label: t("adSpacePublic.size"), value: space.sizeFormat },
    {
      icon: Layers,
      label: t("adSpacePublic.sides"),
      value: space.sides != null ? String(space.sides) : "",
    },
    {
      icon: Eye,
      label: t("adSpacePublic.reach"),
      value:
        space.reachPerDay != null
          ? new Intl.NumberFormat(intlLocale(locale)).format(space.reachPerDay)
          : "",
    },
    { icon: CalendarRange, label: t("adSpacePublic.availability"), value: availability },
  ].filter((f) => Boolean(f.value));

  return (
    <>
      <SiteHeader />

      <section className="pt-8 pb-4">
        <Container>
          <div className="mb-6">
            <Link
              href={`/ads/${slug}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-opacity hover:opacity-80"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("adSpacePublic.backToChannel")}
            </Link>
          </div>

          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t(`adChannel.${channelCode}`)}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              {space.title}
            </h1>
            {space.location ? (
              <p className="mt-3 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                {space.location}
              </p>
            ) : null}
          </Reveal>

          <Reveal delay={0.05}>
            {/* Same two-track hero grid as the report page, and for the same
                reason: minmax(0,…) on both, or the slider's thumbnail strip
                leaks its content width into the track and squeezes the facts
                card. */}
            <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <div className="flex min-w-0 flex-col gap-5">
                {/* The slider is skipped entirely with no photos rather than
                    shown empty — its placeholder is a film frame, which is not
                    what a billboard is. */}
                {images.length > 0 ? (
                  <PosterSlider
                    images={images}
                    alt={space.title}
                    prevLabel={t("report.prev")}
                    nextLabel={t("report.next")}
                  />
                ) : null}
                {space.description.length > 0 ? (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {t("adSpacePublic.descriptionTitle")}
                    </h2>
                    <ul className="mt-3 space-y-2 text-sm text-foreground/75">
                      {space.description.map((line) => (
                        <li key={line} className="flex gap-2.5">
                          <span
                            aria-hidden
                            className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/45"
                          />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              {/* The facts card, in the shape DealCard gives the report page:
                  what it costs, then what the thing physically is, then the
                  way to reach someone about it. */}
              <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
                <div>
                  <Layers className="h-4 w-4 text-primary" />
                  <div className="mt-2 break-words text-lg font-bold text-foreground sm:text-xl">
                    {space.priceFromDisplay
                      ? t("adSpacePublic.priceFrom", { price: space.priceFromDisplay })
                      : t("card.priceOnRequest")}
                  </div>
                  {space.offersCount > 0 ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {space.offersCount === 1
                        ? t("adSpacePublic.offersCountOne")
                        : t("adSpacePublic.offersCount", { n: space.offersCount })}
                    </div>
                  ) : null}
                </div>

                {facts.length > 0 ? (
                  <>
                    <hr className="border-border" />
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-1">
                      {facts.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="min-w-0">
                          <dt className="flex items-start gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            <Icon className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                            <span className="min-w-0">{label}</span>
                          </dt>
                          <dd className="mt-1 break-words text-sm font-medium text-foreground">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </>
                ) : null}

                <div className="pt-1">
                  <Button asChild variant="primary" size="md" className="w-full">
                    <Link href="/contact">{t("adSpacePublic.contactCta")}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <Section id="offers" muted>
        <Container>
          <Reveal>
            <h2 className="text-2xl font-bold text-foreground">{t("adSpacePublic.offersTitle")}</h2>
            <p className="mt-1 text-sm text-foreground/70">
              {t("adSpacePublic.offersSubtitle")}
            </p>
          </Reveal>

          {space.offers.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {space.offers.map((offer, i) => (
                <Reveal key={offer.id} delay={i * 0.05}>
                  <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-7">
                    <h3 className="text-2xl font-normal tracking-tight text-foreground">
                      {offer.name}
                    </h3>
                    {offer.period ? (
                      <span className="mt-2 inline-flex w-fit rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/70">
                        {offer.period}
                      </span>
                    ) : null}
                    {/* No price is a deliberate state, not a missing one —
                        same wording as the offer cards on a project. */}
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
                      {offer.priceDisplay ?? (
                        <span className="text-base font-semibold text-foreground/80">
                          {t("report.priceOnRequest")}
                        </span>
                      )}
                    </p>
                    {offer.totalSlots != null && offer.totalSlots > 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t("adSpacePublic.slots", {
                          // Clamped: the two counts are independent fields, and
                          // "14 free of 11" would print more than exists.
                          free: Math.min(offer.availableSlots ?? 0, offer.totalSlots),
                          total: offer.totalSlots,
                        })}
                      </p>
                    ) : null}
                    {/* Stage 4 turns this into a real application button; until
                        then it is the same /contact door the channel page uses. */}
                    <div className="mt-auto pt-6">
                      <Button asChild variant="secondary" size="sm" className="w-full">
                        <Link href="/contact">{t("adSpacePublic.contactCta")}</Link>
                      </Button>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal delay={0.08}>
              <p className="mt-6 max-w-3xl rounded-2xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground">
                {t("adSpacePublic.noOffers")}
              </p>
            </Reveal>
          )}
        </Container>
      </Section>

      <Footer locale={locale} currency={currency} />
    </>
  );
}
