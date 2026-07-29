import { Clock, Layers, Wallet } from "lucide-react";
import { DealCta } from "@/components/report/deal-cta";
import { formatFullDate } from "@/lib/data/format";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, intlLocale, makeUI, type Locale } from "@/lib/i18n";

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
  daysLeft,
  locale = DEFAULT_LOCALE,
}: {
  /** Production budget, preformatted in the visitor's currency. */
  budgetDisplay: string | null;
  /** Cheapest offer on the page (placement or package), preformatted. */
  fromPrice: string | null;
  slotsFree: number;
  slotsTotal: number;
  /** ISO date; the day itself still counts as open (see isArchived). */
  applicationDeadline: string | null;
  /** Whole days to the deadline, computed on the server — a client-side
   *  Date.now() here would differ from the server render and flicker. */
  daysLeft: number | null;
  locale?: Locale;
}) {
  const t = makeUI(locale);

  const hasBudget = Boolean(budgetDisplay);
  const hasOffer = Boolean(fromPrice) || slotsTotal > 0;
  const hasDeadline = Boolean(applicationDeadline);
  // A project with no budget, no priced offer and no deadline has nothing to
  // put in this card — better an empty column than an empty box with a border
  // around it.
  if (!hasBudget && !hasOffer && !hasDeadline) return null;

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
              {t("report.deal.deadline", {
                date: formatFullDate(applicationDeadline, intlLocale(locale)),
              })}
            </div>
            {countdown ? (
              <div className={cn("text-xs", urgent ? "text-warn" : "text-muted-foreground")}>
                {countdown}
              </div>
            ) : null}
          </div>
        </div>
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
