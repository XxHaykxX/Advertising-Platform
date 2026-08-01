import { Building2, Clapperboard, Clock, Film, Layers, MapPin, Wallet } from "lucide-react";
import { DealCta } from "@/components/report/deal-cta";
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
  locale = DEFAULT_LOCALE,
}: {
  /** Production budget, preformatted in the visitor's currency. */
  budgetDisplay: string | null;
  /** What the project IS — the icon row that used to sit under the hero image
   *  as bare values. It lands here, labelled, in the space this card had left
   *  over above the button (owner decision 2026-07-30). */
  meta: { genres: string[]; format: string; studio: string; countries: string };
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
  ].filter((m) => Boolean(m.value));
  // A project with no budget, no priced offer, no deadline and no facts has
  // nothing to put in this card — better an empty column than an empty box
  // with a border around it.
  if (!hasBudget && !hasOffer && !hasDeadline && metaItems.length === 0) return null;

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
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
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
                <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{label}</span>
                </dt>
                <dd className="mt-1 break-words text-sm font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}

      {/* mt-auto: the button sits on the card's bottom edge whatever the rows
          above add up to, so it lines up with the video next to it instead of
          floating in the middle of the column. */}
      <div className="mt-auto pt-1">
        <DealCta label={t("report.offerBarCta")} />
      </div>
    </div>
  );
}
