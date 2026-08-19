"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, MapPin, Megaphone, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccentBadge } from "@/components/ui/badge";
import { adSpacePath } from "@/lib/ad-space-url";
import { findAdChannel } from "@/lib/ad-channels";
import { mediaUrl } from "@/lib/media-url";
import { DEFAULT_LOCALE, intlLocale, useUI, type Locale } from "@/lib/i18n-client";
import type { AdSpaceListDTO } from "@/lib/types";

/** One ad space in a channel's showcase grid — the AdSpace counterpart of
 *  ProjectCard, laid out the same way on purpose (photo, name, the facts that
 *  decide, then what it costs above the button) so a brand reads the two
 *  showcases the same way.
 *
 *  "use client" (2026-08-10, catalog unification): this used to be a Server
 *  Component — an ad space has no favorite heart or apply button, so nothing
 *  in it needed the browser. It now renders inside CatalogView, a Client
 *  Component, alongside the already-client ProjectCard — so it needs the
 *  browser anyway. The bundle cost this used to avoid is near zero since
 *  ProjectCard is already paying it on the same page.
 *
 *  Prices arrive preformatted in the visitor's currency (see
 *  src/lib/data/ad-spaces.ts); "" means nothing on this space is priced, which
 *  is a deliberate "on request", not a missing value. */
export function AdSpaceCard({
  space,
  channelSlug,
  locale = DEFAULT_LOCALE,
}: {
  space: AdSpaceListDTO;
  /** The URL segment of the channel this card is listed under. */
  channelSlug: string;
  locale?: Locale;
}) {
  const t = useUI(locale);
  const href = adSpacePath(channelSlug, space.code);
  const channel = findAdChannel(channelSlug);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card card-lift">
      {/* Whole-card click target, same as the catalog card. Nothing inside
          competes with it — the button below is part of the same link. */}
      <Link href={href} aria-label={space.title} className="absolute inset-0 z-10" />
      <div className="relative aspect-video shrink-0">
        {space.image ? (
          <Image
            src={mediaUrl(space.image)}
            alt={space.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Megaphone className="h-10 w-10 text-primary/40" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-semibold text-foreground md:text-xl">{space.title}</h3>

        {/* QA-2: a bare title didn't say what kind of space this is — a
            billboard read the same as an elevator panel until the reader
            opened it. Same AccentBadge ProjectCard leads its facts with
            (the "what this IS" chip). */}
        {channel ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <AccentBadge>{t(`adChannel.${channel.code}`)}</AccentBadge>
          </div>
        ) : null}

        {/* Each row drops out on its own: a radio slot has no address, a
            newly-listed panel has no traffic figure, and a bare icon next to
            an empty string is the bug IA-41 fixed on the catalog card. */}
        <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
          {space.location ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{space.location}</span>
            </div>
          ) : null}
          {space.sizeFormat ? (
            <div className="flex items-center gap-2">
              <Ruler className="h-3.5 w-3.5 shrink-0" />
              <span>{space.sizeFormat}</span>
            </div>
          ) : null}
          {space.reachPerDay != null ? (
            <div className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              {/* The number never travels alone — it means nothing without
                  "per day" next to it. */}
              {/* suppressHydrationWarning: this is a client component rendered
                  on the server too, and Intl group separators come from
                  whichever ICU each side was built with. Node has full data
                  and prints "45 000" for hy-AM; a Chromium built without it
                  falls back and prints "45,000" — React then discards the
                  whole tree over a space. Real browsers ship full ICU, so this
                  only bites headless/embedded builds (it turned up in the
                  Playwright suite), but the number is cosmetic either way. */}
              <span suppressHydrationWarning>
                {t("adSpacePublic.reach")}{" "}
                {new Intl.NumberFormat(intlLocale(locale)).format(space.reachPerDay)}
              </span>
            </div>
          ) : null}
        </div>

        {/* What the space sells and what it starts at — the decision block, in
            the same place the catalog card puts it. tabular-nums so prices line
            up between the cards in a row. */}
        <div className="mt-auto pt-4">
          <p className="flex items-baseline justify-between gap-2 text-xs">
            <span className="min-w-0 truncate text-muted-foreground">
              {space.offersCount === 1
                ? t("adSpacePublic.offersCountOne")
                : t("adSpacePublic.offersCount", { n: space.offersCount })}
            </span>
            <span className="shrink-0 whitespace-nowrap tabular-nums">
              {space.priceFromDisplay ? (
                <>
                  <span className="text-muted-foreground">{t("card.priceFrom")} </span>
                  <span className="font-bold text-foreground">{space.priceFromDisplay}</span>
                </>
              ) : (
                <span className="text-muted-foreground">{t("card.priceOnRequest")}</span>
              )}
            </span>
          </p>
          <div className="relative z-20 mt-3">
            <Button asChild variant="secondary" size="sm" className="w-full">
              <Link href={href}>{t("adSpacePublic.cardCta")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
