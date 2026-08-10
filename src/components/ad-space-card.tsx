import Image from "next/image";
import Link from "next/link";
import { Eye, MapPin, Megaphone, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adSpacePath } from "@/lib/ad-space-url";
import { DEFAULT_LOCALE, intlLocale, makeUI, type Locale } from "@/lib/i18n";
import type { AdSpaceListDTO } from "@/lib/types";

/** One ad space in a channel's showcase grid — the AdSpace counterpart of
 *  ProjectCard, laid out the same way on purpose (photo, name, the facts that
 *  decide, then what it costs above the button) so a brand reads the two
 *  showcases the same way.
 *
 *  Unlike ProjectCard this is a Server Component: an ad space has no favorite
 *  heart and no apply button, so nothing here needs the browser — and staying
 *  on the server keeps its keys out of the client dictionary bundle.
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
  const t = makeUI(locale);
  const href = adSpacePath(channelSlug, space.code);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card card-lift">
      {/* Whole-card click target, same as the catalog card. Nothing inside
          competes with it — the button below is part of the same link. */}
      <Link href={href} aria-label={space.title} className="absolute inset-0 z-10" />
      <div className="relative aspect-video shrink-0">
        {space.image ? (
          <Image
            src={space.image}
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
              <span>
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
