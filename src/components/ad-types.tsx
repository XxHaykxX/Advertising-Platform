import Link from "next/link";
import { ArrowRight, Handshake, MousePointerClick, RadioTower, Signpost } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { AD_CHANNEL_GROUPS, AD_GROUP_SLUGS, type AdChannelGroup } from "@/lib/ad-channels";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";

/* The four advertising types — the top level of the whole catalogue, and the
   only way into it since the everything-at-once /ads list was removed
   (2026-08-18). Rendered on the homepage (`#ad-types`, where the header and
   every "browse" button now point) and inside the brand cabinet, which needs
   its own copy: a signed-in member is redirected off "/" to their account, so
   an anchor into the homepage would be unreachable for exactly the buyer this
   is for.

   One icon per group, same family and weight as AD_CHANNEL_ICONS. Kept here
   rather than in ad-channels.ts so that module stays pure data. */
const AD_GROUP_ICONS: Record<AdChannelGroup, LucideIcon> = {
  OUTDOOR: Signpost,
  DIGITAL: MousePointerClick,
  MEDIA: RadioTower,
  SPONSORSHIP: Handshake,
};

export function AdTypes({
  locale = DEFAULT_LOCALE,
  /** The homepage wants the section heading; the cabinet already has a page
   *  title above it and would just repeat itself. */
  showTitle = true,
  className,
}: {
  locale?: Locale;
  showTitle?: boolean;
  className?: string;
}) {
  const t = makeUI(locale);

  // ponytail: no per-group listing count on the cards — it would cost the
  // homepage the two catalogue queries it no longer makes. Add one when the
  // shelves are full enough for the number to sell rather than to warn.
  return (
    <Section id="ad-types" className={className}>
      <Container>
        {showTitle ? (
          <Reveal>
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {t("adTypes.title")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {t("adTypes.subtitle")}
              </p>
            </div>
          </Reveal>
        ) : null}

        <div
          className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 ${showTitle ? "mt-12" : ""}`}
        >
          {AD_CHANNEL_GROUPS.map((group, i) => {
            const Icon = AD_GROUP_ICONS[group];
            return (
              <Reveal key={group} delay={0.06 * i}>
                <Link
                  href={`/ads/${AD_GROUP_SLUGS[group]}`}
                  className="card-lift group flex h-full flex-col rounded-2xl border border-border bg-card p-6 outline-none focus-visible:border-primary"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">
                    {t(`adGroup.${group}`)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {t(`adGroup.${group}.desc`)}
                  </p>
                  {/* What this group is bought FOR, in a media buyer's words.
                      Deliberately a line inside the card and not a second row
                      of "goal" entry points below the grid: with four groups
                      every honest goal maps onto exactly one of them, so a
                      goals row would be these same four cards under different
                      names — two competing ways in, no extra inventory behind
                      either. */}
                  <p className="mt-4 text-xs font-medium text-primary">
                    {t(`adGroup.${group}.goal`)}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    {t("adTypes.cta")}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
