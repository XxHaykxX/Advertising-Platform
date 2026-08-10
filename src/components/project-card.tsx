"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clapperboard,
  Clock,
  Film,
  MapPin,
  Megaphone,
  Award,
} from "lucide-react";
import { GenreBadge, AccentBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteHeart } from "@/components/favorite-heart";
import { daysUntil, formatFullDate, formatReleaseDate, parseStringArray, splitCountries } from "@/lib/data/format";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, intlLocale, useUI, useLocalizer, type Locale } from "@/lib/i18n-client";
import { NO_OFFER_KEY } from "@/lib/offer-value";
import type { SiteHeaderUser } from "@/components/header";
import type { ProjectListDTO } from "@/lib/types";

/** One product the project sells: what it is, how much of it is left, and what
 *  it starts at.
 *
 *  Stacked in two rows rather than three columns. A catalog card is ~260px
 *  wide at the grid's narrowest, and a single row put the product name, the
 *  count and the price in competition for it — the name lost and truncated
 *  away to nothing, which is exactly the confusion this line exists to fix.
 *  The name gets its own row; the count and the price share the one below,
 *  pushed to opposite edges so the prices still line up between products.
 *
 *  tabular-nums on the price: three cards sit side by side in the catalog grid,
 *  and proportional digits make the figures jitter out of line. */
function OfferLine({
  icon,
  label,
  detail,
  detailClass,
  price,
  fromLabel,
  onRequestLabel,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  detailClass?: string;
  /** "" when nothing in this product line carries a price. */
  price: string;
  fromLabel: string;
  onRequestLabel: string;
}) {
  return (
    <div className="mt-2 text-xs">
      <p className="flex items-center gap-1.5 font-semibold text-foreground">
        <span className="shrink-0 text-muted-foreground">{icon}</span>
        {label}
      </p>
      {/* No indent and nowrap on both halves: an eight-figure price ("40 000
          000 ֏") plus a five-px indent pushed the count onto a second line on
          a real catalog card. The row is allowed to run full width instead. */}
      <p className="mt-0.5 flex items-baseline justify-between gap-2">
        <span className={cn("min-w-0 truncate whitespace-nowrap text-muted-foreground", detailClass)}>
          {detail}
        </span>
        <span className="shrink-0 whitespace-nowrap tabular-nums">
          {price ? (
            <>
              <span className="text-muted-foreground">{fromLabel} </span>
              <span className="font-bold text-foreground">{price}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{onRequestLabel}</span>
          )}
        </span>
      </p>
    </div>
  );
}

/** Explicitly "use client" (bundle audit 2026-07-31): its only two callers
 *  (catalog-view.tsx, browse-view.tsx) render it in a loop over
 *  client-side-filtered/sorted project arrays, so it always runs in the
 *  browser anyway — marking it avoids it silently falling back to
 *  server-only i18n imports that would break the moment it's rendered from a
 *  Client Component. */
export function ProjectCard({
  project,
  locale = DEFAULT_LOCALE,
  user = null,
  favorited = false,
  canFavorite = false,
  signedIn = false,
}: {
  project: ProjectListDTO;
  locale?: Locale;
  user?: SiteHeaderUser | null;
  favorited?: boolean;
  canFavorite?: boolean;
  signedIn?: boolean;
}) {
  const t = useUI(locale);
  // One hook call up front — shownGenres.map() below (variable-length,
  // depends on the project) calls this per item; localizeValue() itself
  // reads context and can't be called inside a loop.
  const localize = useLocalizer(locale);
  const countries = splitCountries(project.countries);
  const shownCountries = countries.slice(0, 3);
  const extraCountries = countries.length - shownCountries.length;
  const platforms = parseStringArray(project.platforms);
  // Full date at DAY precision (IA-50 §6 — a day the editor actually entered
  // was being dropped down to month+year on the card), month + year at
  // MONTH, bare year at YEAR — never inventing a day/month that wasn't saved
  // (IA-42).
  const releaseLabel = formatReleaseDate(project.releaseDate, project.releasePrecision, intlLocale(locale), false);
  const deadlineDays = daysUntil(project.applicationDeadline);
  const deadlineUrgent = deadlineDays !== null && deadlineDays <= 45;
  // IA-41: the poster overlay used to show genres[0] only and the row under
  // the title started at genres[1] to avoid repeating it. The overlay is gone
  // now (it covered the image and still dropped every genre past the first),
  // so the row under the title starts at genres[0] and carries all of them.
  // Two badges since 2026-08-05 (owner decision) with the rest collapsed into
  // a "+N" pill — the same convention as the country list above. The counter
  // is not optional: "1988" carries four genres and would silently lose two.
  // .filter(Boolean): a project with neither `genres` nor a legacy `genre`
  // (both empty) fell back to [""], rendering an empty grey pill — exactly
  // the "chip with no value" bug IA-41 was about (review finding, 2026-08-02).
  const allGenres = (project.genres.length > 0 ? project.genres : [project.genre]).filter(Boolean);
  const shownGenres = allGenres.slice(0, 2);
  const moreGenres = allGenres.length - shownGenres.length;
  // Platforms are NOT capped (owner decision 2026-08-05, reversing the cap
  // added the same day): where a project actually airs is a fact a brand
  // weighs, and "+1" hides which channel it was. Genres collapse, this list
  // does not.
  // A brand is the only viewer who can apply, so it is the only one whose
  // button says so. `?offer=-` opens the report page with the application
  // popup already up — see OFFER_QUERY_PARAM.
  const canApply = canFavorite;
  const reportHref = `/reports/${project.id}`;
  // Capacity bar (2026-08-05). Filled = already taken, so the bar grows as the
  // project sells out. Clamped because availableSlots and totalSlots are two
  // independently-editable admin fields: nothing stops a publisher leaving 12
  // available out of 10 total, and an unclamped width would paint outside the
  // track.
  const slotsTaken = Math.max(0, project.slotsTotal - project.slotsAvailable);
  const slotsTakenPct =
    project.slotsTotal > 0 ? Math.min(100, Math.round((slotsTaken / project.slotsTotal) * 100)) : 0;
  const slotsLow = project.slotsTotal > 0 && project.slotsAvailable <= 2;
  // The marketing bucket ("Series", "Feature film") — already in the DTO and
  // already the catalog's Format filter, but never shown on the card until
  // 2026-08-05. Distinct from `project.format` below, which is the runtime
  // ("12 ep x 11 min").
  const formatCategoryRaw = project.formatCategory
    ? localize("formatCategory", project.formatCategory)
    : "";
  // "Animation" is both a genre and a format bucket, and the two localize to
  // the same word — the chip row rendered "Անիմացիա · Արկածային · +1 ·
  // Անիմացիա" on the very first project in the catalog. A chip that repeats
  // its neighbour is noise, so drop it rather than teach the reader to ignore
  // duplicates.
  const shownGenreLabels = shownGenres.map((g) => localize("genre", g));
  const formatCategoryLabel = shownGenreLabels.includes(formatCategoryRaw) ? "" : formatCategoryRaw;
  // Language is a CSV of one or more values (admin redesign phase 1) — used to
  // only drive the filter and was never shown on the card itself.

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card card-lift">
      {/* Whole-card click target → report. Sits under the action buttons
          (which are z-10) so Apply / View Report still work. */}
      <Link
        href={`/reports/${project.id}`}
        aria-label={project.title}
        className="absolute inset-0 z-10"
      />
      <div className="relative aspect-video shrink-0">
        {project.poster ? (
          <Image
            src={project.poster}
            alt={project.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Film className="h-10 w-10 text-primary/40" />
          </div>
        )}
        {/* Content rating, top-LEFT so it never collides with the heart
            (2026-08-05). Solid dark plate rather than a translucent one: the
            poster underneath is arbitrary artwork, and on a light one — the
            animation posters are all light — a see-through badge disappears.
            The rating is a fact a brand screens on, so it cannot be a chip
            that only sometimes reads. */}
        {project.ageRating ? (
          <span className="absolute left-3 top-3 z-[5] rounded-md bg-black/75 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
            {project.ageRating}
          </span>
        ) : null}
        <FavoriteHeart
          projectId={project.id}
          initialFavorite={favorited}
          canFavorite={canFavorite}
          signedIn={signedIn}
          addAria={t("favorite.addAria")}
          removeAria={t("favorite.removeAria")}
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        {/* The title owns its line (owner decision 2026-08-05). It used to
            share one flex-wrap container with every badge, so the pills flowed
            around the project name and it stopped reading as a heading. */}
        <h3 className="text-lg font-semibold text-foreground md:text-xl">{project.title}</h3>
        {/* What the project IS — genres and format. Availability and price are
            not categories and no longer sit here; they moved down to the
            decision block above the button. */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Format leads, and reads differently from the genres after it
              (IA-50 §2) — on a chip row the two used to be indistinguishable
              ("Sci-Fi · Drama · +2 · Mini-series" reads as four genres),
              even though only the last one is what the project actually IS. */}
          {formatCategoryLabel ? <AccentBadge>{formatCategoryLabel}</AccentBadge> : null}
          {shownGenres.map((g, i) => (
            <GenreBadge key={g}>{shownGenreLabels[i]}</GenreBadge>
          ))}
          {moreGenres > 0 ? <GenreBadge>+{moreGenres}</GenreBadge> : null}
        </div>
        <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
          {/* IA-41: format and countries used to render unconditionally, so a
              project missing either printed a bare icon next to an empty
              string. Same rule as release/deadline below — no value, no row. */}
          {project.format ? (
            <div className="flex items-center gap-2">
              <Clapperboard className="h-3.5 w-3.5 shrink-0" />
              <span>{project.format}</span>
            </div>
          ) : null}
          {shownCountries.length > 0 ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>
                {shownCountries.join(", ")}
                {extraCountries > 0 ? ` +${extraCountries}` : ""}
              </span>
            </div>
          ) : null}
          {releaseLabel ? (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {/* The separator lives in the dictionary, not here (same as
                  card.availableOn): Armenian separates a label from its value
                  with a but (՝), not a colon, so a hardcoded ":" printed
                  "Ցուցադրությունը՝: 2026 թ." on the Armenian card. */}
              <span>{t("card.release")} {releaseLabel}</span>
            </div>
          ) : null}
          {project.applicationDeadline || project.applicationDeadlineOngoing ? (
            <div className={cn("flex items-center gap-2", deadlineUrgent ? "text-warn" : undefined)}>
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {/* Close to the deadline the card counts down instead of naming
                  a date (2026-08-05): the row already turned amber at 45 days
                  but still made the reader subtract today from a date to find
                  out how urgent that was. Past the deadline the project is
                  archived and never reaches the catalog, so a negative count
                  cannot appear here. */}
              <span>
                {/* IA-50 §4: Ongoing used to print bare, with no label saying
                    what it's ongoing FOR — every other branch here names
                    itself ("Applications until <date>"). */}
                {project.applicationDeadlineOngoing
                  ? `${t("card.applicationsLabel")} ${t("deadline.ongoing")}`
                  : deadlineUrgent && deadlineDays !== null
                    ? deadlineDays <= 0
                      ? t("card.deadlineLastDay")
                      : t("card.deadlineDaysLeft").replace("{n}", String(deadlineDays))
                    : `${t("card.applicationsUntil")} ${formatFullDate(project.applicationDeadline, intlLocale(locale))}`}
              </span>
            </div>
          ) : null}
        </div>

        {platforms.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {/* IA-41: the chip row had no label — say what these values ARE
                before listing them, same as the report page's platform row.
                IA-50 §3: label and chips share one line now — the label used
                to sit on its own row above them. */}
            <span className="text-[11px] font-medium text-muted-foreground">{t("card.availableOn")}</span>
            {platforms.map((p) => (
              <span
                key={p}
                className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {p}
              </span>
            ))}
          </div>
        ) : null}

        {/* The decision block (2026-08-05): what is left, and what it costs.
            Both used to be grey pills up in the title row — indistinguishable
            from "Family" — or, in the price's case, absent from the card
            entirely, so a brand could not compare two listings without opening
            both. */}
        <div className="mt-auto pt-4">
          {/* What the project actually sells, one named line per product
              (2026-08-05). It used to be a slot counter, a placement counter
              and a single "from" price with nothing tying any number to any
              offer — the slots came from the sponsorship packages alone, while
              the price was the cheaper of the two products, so a reader could
              not tell what the figure bought. */}
          {project.placementsCount > 0 ? (
            <OfferLine
              icon={<Megaphone className="h-3.5 w-3.5 shrink-0" />}
              label={t("card.offerPlacements")}
              detail={
                project.placementsCount === 1
                  ? t("card.offerOptionsOne")
                  : t("card.offerOptions").replace("{n}", String(project.placementsCount))
              }
              price={project.placementsPriceFromDisplay}
              fromLabel={t("card.priceFrom")}
              onRequestLabel={t("card.priceOnRequest")}
            />
          ) : null}
          {/* Which KINDS of integration are on offer (2026-08-10) — a chip row
              under the placements line, not part of it: "N options · from X"
              is the size and the price of the offer, and folding "Verbal
              mention" into that sentence would read as another number. Absent
              for a project whose placements nobody has classified yet. */}
          {project.placementTypes.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {project.placementTypes.map((v) => (
                <span
                  key={v}
                  className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {localize("placementType", v)}
                </span>
              ))}
            </div>
          ) : null}
          {project.tiersCount > 0 ? (
            <>
              <OfferLine
                icon={<Award className="h-3.5 w-3.5 shrink-0" />}
                label={t("card.offerSponsorship")}
                detail={
                  project.slotsTotal > 0
                    ? t("card.slotsLeft")
                        .replace("{n}", String(project.slotsAvailable))
                        .replace("{total}", String(project.slotsTotal))
                    : project.tiersCount === 1
                      ? t("card.offerOptionsOne")
                      : t("card.offerOptions").replace("{n}", String(project.tiersCount))
                }
                detailClass={slotsLow ? "text-warn" : undefined}
                price={project.tiersPriceFromDisplay}
                fromLabel={t("card.priceFrom")}
                onRequestLabel={t("card.priceOnRequest")}
              />
              {/* The bar sits under sponsorship because that is the only thing
                  slotsTotal counts. Filled = already taken, so a project fills
                  up visibly as deals land; the wording above says the same in
                  words, since colour alone must never carry it. */}
              {project.slotsTotal > 0 ? (
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-[width]", slotsLow ? "bg-warn" : "bg-primary")}
                    style={{ width: `${slotsTakenPct}%` }}
                  />
                </div>
              ) : null}
            </>
          ) : null}
          {/* Neither product exists yet — say the price is on request rather
              than leave the card silent about money altogether. */}
          {project.placementsCount === 0 && project.tiersCount === 0 ? (
            <p className="text-sm font-medium text-muted-foreground">{t("card.priceOnRequest")}</p>
          ) : null}
          <div className="relative z-20 mt-3">
            {/* A brand goes straight to the application; everyone else — a
                guest, a creator, staff — gets the report, which is all they can
                act on. The popup itself cannot live here: it needs the offers,
                the brand's phone and the applications already sent, none of
                which the catalog loads. */}
            <Button asChild variant={canApply ? "primary" : "secondary"} size="sm" className="w-full">
              <Link href={canApply ? `${reportHref}?offer=${NO_OFFER_KEY}` : reportHref}>
                {canApply ? t("card.applyCta") : t("btn.viewReport")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
