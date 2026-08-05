import {
  Building2,
  CalendarDays,
  Clapperboard,
  Clock,
  Film,
  Layers,
  MapPin,
  MonitorPlay,
  Popcorn,
  Wallet,
} from "lucide-react";
import { DealCta } from "@/components/report/deal-cta";
import { PresentationDownload } from "@/components/report/presentation-download";
import { formatFullDate, splitCountries } from "@/lib/data/format";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, intlLocale, localizeValue, makeUI, type Locale } from "@/lib/i18n";

/** The offer, in the right column of the hero (owner decision 2026-07-29).
 *
 *  That column held the production budget and about 280px of empty space,
 *  while the first screen had no way to act at all — the sticky bar only
 *  appears once the overview section (1648px tall, two screenfuls on a phone)
 *  has been scrolled past, and the one apply button before that sat inside the
 *  facts block, visually attached to the "Comparable to" posters next to it.
 *
 *  Four tiers, top to bottom: what the film costs to make, what a placement in
 *  it costs, what is still free, and how long the brand has. Nothing here is
 *  fetched — every value is already computed in page.tsx for the sticky bar.
 *
 *  Same card for everyone. A creator or staff member previewing the project
 *  sees the figures without the button (see DealCta), rather than an empty
 *  column. */
export function DealCard({
  budgetDisplay,
  fromPrice,
  slotsFree,
  slotsTotal,
  applicationDeadline,
  ongoing = false,
  daysLeft,
  meta,
  where,
  presentationPdf,
  locale = DEFAULT_LOCALE,
}: {
  /** Production budget, preformatted in the visitor's currency. */
  budgetDisplay: string | null;
  /** What the project IS — the icon row that used to sit under the hero image
   *  as bare values. It lands here, labelled, in the space this card had left
   *  over above the button (owner decision 2026-07-30).
   *
   *  `release` joined it on 2026-08-05 together with the two chip rows below:
   *  the whole "where it airs / when" half of the facts block moved into this
   *  card, because a brand was reading the price here and then having to scroll
   *  to a second card to learn where the thing actually airs. Preformatted by
   *  the caller (it needs the project's release PRECISION, which this card is
   *  not given) — null when the creator never set a release date. */
  meta: {
    genres: string[];
    format: string;
    studio: string;
    countries: string;
    release: string | null;
  };
  /** Streaming/TV platforms and cinema chains, rendered as chip rows under the
   *  facts. Empty arrays simply render nothing — no label above an empty row. */
  where: { platforms: string[]; cinemas: string[] };
  /** Cheapest offer on the page (placement or package), preformatted. */
  fromPrice: string | null;
  slotsFree: number;
  slotsTotal: number;
  /** ISO date; the day itself still counts as open (see isArchived). Always
   *  null when `ongoing` is true. */
  applicationDeadline: string | null;
  /** Ongoing (IA-42): an open-ended call for offers — renders in place of a
   *  date, with no countdown underneath it. */
  ongoing?: boolean;
  /** Whole days to the deadline, computed on the server — a client-side
   *  Date.now() here would differ from the server render and flicker. Always
   *  null when `ongoing` is true (there's nothing to count down to). */
  daysLeft: number | null;
  /** `project.presentationPdf`; empty string when the creator never uploaded
   *  one — the link under the CTA below then renders nothing. */
  presentationPdf: string;
  locale?: Locale;
}) {
  const t = makeUI(locale);

  const hasBudget = Boolean(budgetDisplay);
  const hasOffer = Boolean(fromPrice) || slotsTotal > 0;
  const hasDeadline = Boolean(applicationDeadline) || ongoing;
  // Each fact carries its own label, so an unfamiliar studio name no longer
  // reads as a word with no explanation. Empty ones drop out entirely — a
  // label above nothing is worse than a missing row.
  const metaItems = [
    // IA-40: list EVERY genre the project carries, not just the first —
    // same comma-joined, per-value localization as the countries fact below.
    {
      icon: Film,
      label: t("keyFacts.genre"),
      value: meta.genres.map((g) => localizeValue(locale, "genre", g)).join(", "),
    },
    { icon: Clapperboard, label: t("keyFacts.format"), value: meta.format },
    { icon: Building2, label: t("keyFacts.studio"), value: meta.studio },
    { icon: MapPin, label: t("keyFacts.countries"), value: splitCountries(meta.countries).join(", ") },
    { icon: CalendarDays, label: t("keyFacts.release"), value: meta.release ?? "" },
  ].filter((m) => Boolean(m.value));
  // Chip rows, each dropping out on its own when the creator filled neither.
  const chipRows = [
    { icon: MonitorPlay, label: t("keyFacts.platforms"), values: where.platforms },
    { icon: Popcorn, label: t("keyFacts.cinemas"), values: where.cinemas },
  ].filter((row) => row.values.length > 0);
  // A project with no budget, no priced offer, no deadline and no facts has
  // nothing to put in this card — better an empty column than an empty box
  // with a border around it.
  if (!hasBudget && !hasOffer && !hasDeadline && metaItems.length === 0 && chipRows.length === 0)
    return null;

  // Matches the catalog card's threshold, so "closing soon" means the same
  // thing in the list and on the page.
  const urgent = daysLeft !== null && daysLeft <= 45;
  const countdown =
    // Past the deadline the project is archived and the button below already
    // says offers are closed — a countdown there would have to count backwards.
    daysLeft === null || daysLeft < 0
      ? null
      : daysLeft === 0
        ? t("report.deal.lastDay")
        : daysLeft === 1
          ? t("report.deal.oneDayLeft")
          : t("report.deal.daysLeft", { n: daysLeft });

  return (
    // Deliberately NOT h-full. The card used to stretch to the row height so
    // its button lined up with the bottom of the video beside it — fine while
    // the card was the taller of the two. Since the synopsis and the thumbnail
    // strip moved into the left column (2026-08-05) that column can be the
    // taller one, and h-full then opened a ~200px hole between the facts and
    // the button, INSIDE a bordered card. Sized to its content the leftover
    // space falls outside the card instead, where it reads as page, not as a
    // gap someone forgot to fill. (`items-start` on the hero grid is what lets
    // this shrink: without it the grid would stretch the card anyway.)
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      {hasBudget ? (
        <div>
          <Wallet className="h-4 w-4 text-primary" />
          <div className="mt-2 break-words text-base font-bold text-foreground sm:text-lg">
            {budgetDisplay}
          </div>
          <div className="text-xs text-muted-foreground">{t("report.productionBudget")}</div>
        </div>
      ) : null}

      {hasBudget && hasOffer ? <hr className="border-border" /> : null}

      {hasOffer ? (
        <div>
          <Layers className="h-4 w-4 text-primary" />
          {fromPrice ? (
            <div className="mt-2 break-words text-lg font-bold text-foreground sm:text-xl">
              {t("report.offerBarFrom", { price: fromPrice })}
            </div>
          ) : null}
          {slotsTotal > 0 ? (
            <div className={cn("text-xs", fromPrice ? "mt-1" : "mt-2", "text-muted-foreground")}>
              {t("report.offerBarSlots", { free: slotsFree, total: slotsTotal })}
            </div>
          ) : null}
        </div>
      ) : null}

      {hasDeadline ? (
        <div className="flex items-start gap-2 text-sm">
          <Clock className={cn("mt-0.5 h-4 w-4 shrink-0", urgent ? "text-warn" : "text-primary")} />
          <div className="min-w-0">
            <div className="break-words font-medium text-foreground">
              {ongoing
                ? t("deadline.ongoing")
                : t("report.deal.deadline", {
                    date: formatFullDate(applicationDeadline, intlLocale(locale)),
                  })}
            </div>
            {/* No countdown for an open call — daysLeft is always null
                alongside `ongoing`, but the flag is checked directly rather
                than relying on that always being true. */}
            {!ongoing && countdown ? (
              <div className={cn("text-xs", urgent ? "text-warn" : "text-muted-foreground")}>
                {countdown}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {metaItems.length > 0 ? (
        <>
          {hasBudget || hasOffer || hasDeadline ? <hr className="border-border" /> : null}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 max-sm:grid-cols-1">
            {metaItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="min-w-0">
                {/* Labels wrap rather than truncate: this card is ~185px per
                    column at desktop and the Armenian labels are longer than
                    that, so truncation turned half of them into "ՆԿԱՐԱՀ…".
                    items-start keeps the icon on the first line when a label
                    takes two. */}
                <dt className="flex items-start gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Icon className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="min-w-0">{label}</span>
                </dt>
                <dd className="mt-1 break-words text-sm font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}

      {/* Where it airs — the chip rows that used to open the facts block below.
          They sit last among the facts because they are the widest thing in
          this column and a wrapping chip row would otherwise push the labelled
          two-column grid around (owner decision 2026-08-05). */}
      {chipRows.length > 0 ? (
        <>
          {hasBudget || hasOffer || hasDeadline || metaItems.length > 0 ? (
            <hr className="border-border" />
          ) : null}
          <div className="flex flex-col gap-3">
            {chipRows.map(({ icon: Icon, label, values }) => (
              <div key={label} className="min-w-0">
                <div className="flex items-start gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Icon className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="min-w-0">{label}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {values.map((v) => (
                    <span
                      key={v}
                      className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* mt-auto: the button sits on the card's bottom edge whatever the rows
          above add up to, so it lines up with the video next to it instead of
          floating in the middle of the column. */}
      <div className="mt-auto space-y-2 pt-1">
        {/* Above the apply button, not under it (owner decision 2026-08-05):
            the deck is what a brand reaches for BEFORE it is ready to apply —
            to read the offer properly, or to forward it to whoever signs off.
            Buried under the CTA it read as an afterthought nobody scrolled to.
            It still carries less weight than the apply button so the primary
            action stays primary. This is the deck's only place on the page —
            a second copy above the footer was cut as noise. */}
        <PresentationDownload href={presentationPdf} locale={locale} />
        <DealCta label={t("report.offerBarCta")} />
      </div>
    </div>
  );
}
