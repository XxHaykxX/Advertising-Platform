"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  filtersFromQuery,
  filtersToQuery,
  type CatalogFilters,
} from "./catalog-url-state";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  Film,
  LayoutGrid,
  List,
  MapPin,
  Megaphone,
  Ruler,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { GenreBadge, AccentBadge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/project-card";
import { AdSpaceCard } from "@/components/ad-space-card";
import { FavoriteHeart } from "@/components/favorite-heart";
import { Header, type SiteHeaderUser } from "@/components/header";
import { compareDeadline, daysUntil, formatFullDate, parseStringArray, splitCountries } from "@/lib/data/format";
import {
  FORMAT_CATEGORY_VALUES,
  PLACEMENT_TYPE_VALUES,
} from "@/app/admin/(panel)/projects/form-shared";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/lib/body-scroll-lock";
import { DEFAULT_LOCALE, intlLocale, useUI, useLocalizer, type Locale } from "@/lib/i18n-client";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currency";
import { NO_OFFER_KEY } from "@/lib/offer-value";
import { AD_CHANNELS, findAdChannel } from "@/lib/ad-channels";
import { adSpacePath } from "@/lib/ad-space-url";
import { localizeCity } from "@/lib/cities";
import { pluralForm } from "@/lib/plural";
import type { AdSpaceListDTO, ProjectListDTO } from "@/lib/types";

type ViewMode = "grid" | "list";

// 5.7: "default" keeps the source order (sortOrder, as getProjects returns
// it) — the other three re-sort the already-filtered list client-side.
type SortOption = "default" | "newest" | "deadline" | "title";

// Cards per "page" — the client-side pagination reveals results in chunks of
// this size instead of rendering the whole (small but growing) catalog at
// once. 12 = 4 full rows of 3 in the grid view.
const PAGE_SIZE = 12;

/** One entry in the unified catalog (2026-08-10, stage B) — a project selling
 *  placement/sponsorship, or a standalone ad space (billboard, radio slot,
 *  …). ProjectCard and AdSpaceCard stay two different components (they show
 *  different facts), so this only unifies what the shared mechanics — search,
 *  sort, the channel facet — need to agree on. Built server-side in
 *  catalog/page.tsx; `channels` and `haystack` are precomputed there so the
 *  client never has to know the ad-channel rules or re-join genre/country
 *  strings on every keystroke. */
export type CatalogRow = { key: string; channels: string[]; title: string; haystack: string } & (
  | { kind: "PROJECT"; project: ProjectListDTO }
  | { kind: "AD_SPACE"; space: AdSpaceListDTO; channelSlug: string }
);

function ProjectRow({
  project,
  locale = DEFAULT_LOCALE,
  user = null,
  favorited = false,
  canFavorite = false,
  isOwn = false,
  signedIn = false,
}: {
  project: ProjectListDTO;
  locale?: Locale;
  user?: SiteHeaderUser | null;
  favorited?: boolean;
  canFavorite?: boolean;
  /** See FavoriteHeart. */
  isOwn?: boolean;
  signedIn?: boolean;
}) {
  const t = useUI(locale);
  // One hook call up front — shownExtraGenres.map() below (variable-length,
  // depends on the project) calls this per item; localizeValue() itself
  // reads context and can't be called inside a loop.
  const localize = useLocalizer(locale);
  const countries = splitCountries(project.countries);
  const deadlineDays = daysUntil(project.applicationDeadline);
  const deadlineUrgent = deadlineDays !== null && deadlineDays <= 45;
  // 5.6: same convention as ProjectCard — two genres, then "+N". Switching
  // between the grid and this list must not change which facts a project
  // appears to have, so the 2026-08-05 card rules apply here too.
  // .filter(Boolean): a project with neither `genres` nor a legacy `genre`
  // fell back to [""], which the unconditional first badge below then
  // rendered as an empty grey pill (review finding, 2026-08-02).
  const allGenres = (project.genres.length > 0 ? project.genres : [project.genre]).filter(Boolean);
  const shownGenres = allGenres.slice(0, 2);
  const moreGenres = allGenres.length - shownGenres.length;
  const canApply = canFavorite;
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 card-lift sm:flex-row sm:items-center">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg sm:w-48">
        {project.poster ? (
          <Image
            src={project.poster}
            alt={project.title}
            fill
            className="object-cover"
            sizes="192px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Film className="h-8 w-8 text-primary/40" />
          </div>
        )}
        {/* Same solid plate as the card's — see ProjectCard for why it is not
            translucent. */}
        {project.ageRating ? (
          <span className="absolute left-2 top-2 z-[5] rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-bold text-white">
            {project.ageRating}
          </span>
        ) : null}
        <FavoriteHeart
          projectId={project.id}
          initialFavorite={favorited}
          canFavorite={canFavorite}
          isOwn={isOwn}
          signedIn={signedIn}
          addAria={t("favorite.addAria")}
          removeAria={t("favorite.removeAria")}
          ownAria={t("favorite.ownAria")}
        />
      </div>

      <div className="min-w-0 flex-1">
        {/* The title owns its line here too (2026-08-05). */}
        <h3 className="text-lg font-semibold text-foreground">{project.title}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {shownGenres.map((g) => (
            <GenreBadge key={g}>{localize("genre", g)}</GenreBadge>
          ))}
          {moreGenres > 0 ? <GenreBadge>+{moreGenres}</GenreBadge> : null}
        </div>
        <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">{project.synopsis}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{project.format}</span>
          <span>{countries.slice(0, 3).join(", ")}</span>
          {project.applicationDeadline || project.applicationDeadlineOngoing ? (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                deadlineUrgent ? "text-warn" : undefined,
              )}
            >
              <Clock className="h-3 w-3 shrink-0" />
              {project.applicationDeadlineOngoing
                ? t("deadline.ongoing")
                : deadlineUrgent && deadlineDays !== null
                  ? deadlineDays <= 0
                    ? t("card.deadlineLastDay")
                    : t("card.deadlineDaysLeft").replace("{n}", String(deadlineDays))
                  : `${t("catalog.until")} ${formatFullDate(project.applicationDeadline, intlLocale(locale))}`}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
        {/* Price, the fact this row never carried (2026-08-05) — a list view
            is where comparing listings actually happens. */}
        <p className="text-base font-bold tabular-nums text-foreground">
          {project.priceFromDisplay ? (
            <>
              <span className="text-xs font-medium text-muted-foreground">{t("card.priceFrom")} </span>
              {project.priceFromDisplay}
            </>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">{t("card.priceOnRequest")}</span>
          )}
        </p>
        <Button asChild variant="primary" size="sm" className="w-full sm:w-auto">
          <Link
            href={canApply ? `/reports/${project.id}?offer=${NO_OFFER_KEY}` : `/reports/${project.id}`}
          >
            {canApply ? t("card.applyCta") : t("btn.viewReport")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

/** The AdSpaceCard counterpart of ProjectRow above — same layout, an address
 *  and a size/reach line instead of genres and a deadline. */
function AdSpaceRow({
  space,
  channelSlug,
  locale = DEFAULT_LOCALE,
}: {
  space: AdSpaceListDTO;
  channelSlug: string;
  locale?: Locale;
}) {
  const t = useUI(locale);
  const href = adSpacePath(channelSlug, space.code);
  const channel = findAdChannel(channelSlug);
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 card-lift sm:flex-row sm:items-center">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg sm:w-48">
        {space.image ? (
          <Image src={space.image} alt={space.title} fill className="object-cover" sizes="192px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Megaphone className="h-8 w-8 text-primary/40" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold text-foreground">{space.title}</h3>
        {/* QA-2: same channel chip as AdSpaceCard's grid view — a list row
            gave a title and an address, never what kind of space it is. */}
        {channel ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <AccentBadge>{t(`adChannel.${channel.code}`)}</AccentBadge>
          </div>
        ) : null}
        {/* Same "no value, no row" rule as ProjectRow/AdSpaceCard — a radio
            slot has no address, a newly-listed panel has no traffic figure. */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {space.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {space.location}
            </span>
          ) : null}
          {space.sizeFormat ? (
            <span className="inline-flex items-center gap-1">
              <Ruler className="h-3 w-3 shrink-0" />
              {space.sizeFormat}
            </span>
          ) : null}
          {space.reachPerDay != null ? (
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3 shrink-0" />
              {t("adSpacePublic.reach")} {new Intl.NumberFormat(intlLocale(locale)).format(space.reachPerDay)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
        <p className="text-base font-bold tabular-nums text-foreground">
          {space.priceFromDisplay ? (
            <>
              <span className="text-xs font-medium text-muted-foreground">{t("card.priceFrom")} </span>
              {space.priceFromDisplay}
            </>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">{t("card.priceOnRequest")}</span>
          )}
        </p>
        <Button asChild variant="secondary" size="sm" className="w-full sm:w-auto">
          <Link href={href}>{t("adSpacePublic.cardCta")}</Link>
        </Button>
      </div>
    </div>
  );
}

function CheckboxFilter({
  label,
  options,
  selected,
  onToggle,
  defaultOpen = true,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
      >
        {label}
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open ? (
        <div className="mt-3 flex flex-col gap-2.5">
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={() => onToggle(o.value)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              {o.label}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CatalogView({
  rows,
  locale = DEFAULT_LOCALE,
  currency = DEFAULT_CURRENCY,
  user = null,
  favorites = new Set(),
  ownIds = new Set(),
  signedIn = false,
  isBrand = false,
  initialChannel,
  footer,
}: {
  /** Every project and ad space in the marketplace, one flat list (2026-08-10,
   *  stage B) — see CatalogRow above. */
  rows: CatalogRow[];
  locale?: Locale;
  currency?: CurrencyCode;
  user?: SiteHeaderUser | null;
  /** projectIds the current BRAND visitor has favorited (#22) — empty for
   *  guests/non-brand members, which renders every heart outline/inert. */
  favorites?: Set<number>;
  /** projectIds the current visitor OWNS (2026-08-11, dual-side accounts) —
   *  same shape as `favorites`; a dual member can't apply/favorite their own
   *  listing, so its card renders with neither. Empty for anyone who can't
   *  sell — see catalog/page.tsx. */
  ownIds?: Set<number>;
  signedIn?: boolean;
  isBrand?: boolean;
  /** AD_CHANNELS code from `?channel=` (2026-08-10) — set when a visitor
   *  arrived from a channel's "view all in catalog" teaser. Only seeds the
   *  channel facet's initial value; a full filter↔URL sync is out of scope
   *  (see the plan). */
  initialChannel?: string;
  /** <Footer/>, rendered by the server page (catalog/page.tsx) and passed
   *  down instead of imported here — Footer is a plain Server Component used
   *  by many pure-server pages (bundle audit 2026-07-31); importing it
   *  directly into this Client Component would force it into every page's
   *  client bundle, not just this one. */
  footer: ReactNode;
}) {
  // ponytail: the whole catalog is serialized to the client and filtered/sorted
  // there — fine at a few hundred rows, move to searchParams-driven server
  // filtering once it stops being fine.
  const t = useUI(locale);
  // One hook call up front — genres.map()/FORMAT_CATEGORY_VALUES.map() below
  // call this per item; localizeValue() itself reads context and can't be
  // called inside a loop.
  const localize = useLocalizer(locale);

  const [selectedChannels, setSelectedChannels] = useState<string[]>(
    initialChannel ? [initialChannel] : [],
  );
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedPlacementTypes, setSelectedPlacementTypes] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("default");

  // Channel facet options: codes actually present across the whole catalog
  // (not narrowed by any other filter — a facet whose own checkboxes vanish
  // as you use it is a broken facet), in the director's AD_CHANNELS order.
  const channelOptions = useMemo(() => {
    const present = new Set(rows.flatMap((r) => r.channels));
    return AD_CHANNELS.filter((c) => present.has(c.code));
  }, [rows]);

  // Rows that survive the channel facet alone — every other facet's option
  // list is derived from THIS, not from `rows` and not from the fully
  // filtered set: picking BILLBOARD should narrow which genres show (there
  // are none), but picking Comedy must not make BILLBOARD itself disappear
  // from the channel checkboxes.
  const channelFiltered = useMemo(
    () =>
      selectedChannels.length === 0
        ? rows
        : rows.filter((r) => r.channels.some((c) => selectedChannels.includes(c))),
    [rows, selectedChannels],
  );
  const channelFilteredProjects = useMemo(
    () => channelFiltered.flatMap((r) => (r.kind === "PROJECT" ? [r.project] : [])),
    [channelFiltered],
  );
  const channelFilteredSpaces = useMemo(
    () => channelFiltered.flatMap((r) => (r.kind === "AD_SPACE" ? [r.space] : [])),
    [channelFiltered],
  );

  // 5.6: the genre facet (and the filter match below) now considers every
  // genre a project carries, not just genres[0] — a project tagged
  // Comedy+Drama should surface under either filter, not just the first.
  const genres = useMemo(
    () =>
      Array.from(
        new Set(channelFilteredProjects.flatMap((p) => (p.genres.length > 0 ? p.genres : [p.genre]))),
      ).sort(),
    [channelFilteredProjects],
  );
  // 5.8: only offer the "Unspecified" format bucket when the catalog actually
  // has a row with an empty formatCategory — same pattern as platform/country
  // below, so the checkbox never appears with nothing behind it.
  const hasUnspecifiedFormat = useMemo(
    () => channelFilteredProjects.some((p) => !p.formatCategory),
    [channelFilteredProjects],
  );
  // Formats actually present in the catalog, kept in FORMAT_CATEGORY_VALUES
  // order rather than sorted: that order is editorial (Feature film → Series →
  // Mini-series → …), and alphabetising it would scatter related buckets.
  //
  // This used to render the whole closed set — twelve checkboxes over a catalog
  // holding three formats, nine of which filtered to nothing (owner report
  // 2026-07-31).
  const formatOptions = useMemo(() => {
    const present = new Set(channelFilteredProjects.map((p) => p.formatCategory).filter(Boolean));
    return FORMAT_CATEGORY_VALUES.filter((v) => present.has(v));
  }, [channelFilteredProjects]);
  // Distinct platforms / countries actually present across the projects.
  const platformOptions = useMemo(
    () => Array.from(new Set(channelFilteredProjects.flatMap((p) => parseStringArray(p.platforms)))).sort(),
    [channelFilteredProjects],
  );
  const countryOptions = useMemo(
    () => Array.from(new Set(channelFilteredProjects.flatMap((p) => splitCountries(p.countries)))).sort(),
    [channelFilteredProjects],
  );
  // Integration kinds actually on offer across the catalog (2026-08-10), in
  // PLACEMENT_TYPE_VALUES order for the same editorial reason as formatOptions
  // above. Nothing classified yet -> no facet at all, rather than four
  // checkboxes that each filter to zero.
  const placementTypeOptions = useMemo(() => {
    const present = new Set(channelFilteredProjects.flatMap((p) => p.placementTypes));
    return PLACEMENT_TYPE_VALUES.filter((v) => present.has(v));
  }, [channelFilteredProjects]);
  // The one ad-space facet (plan B3) — sizeFormat is free text and
  // reachPerDay wants a range slider the rail doesn't have; City is the only
  // one that's a clean closed set today.
  const cityOptions = useMemo(
    () => Array.from(new Set(channelFilteredSpaces.map((s) => s.city).filter(Boolean))).sort(),
    [channelFilteredSpaces],
  );
  // How many of the filtered+sorted results are currently rendered — the
  // "Show more" button below the list grows this by PAGE_SIZE at a time.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Mobile filters live in a bottom-sheet (industry-standard on small screens —
  // a stacked sidebar buries the results below a long filter column). Desktop
  // keeps the always-visible sidebar.
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Persist the filter selection for the tab session so leaving for a media
  // detail page and pressing Back restores the filters instead of resetting
  // everything to defaults (IA-24). Kept in sessionStorage (contained, no URL
  // churn); "Clear all" naturally overwrites it with the empty state.
  const FILTERS_KEY = "catalog:filters";
  const restoredRef = useRef(false);
  // Has to be an effect: neither the URL nor sessionStorage exists during the
  // server render, so a stored/linked selection can only be applied after
  // mount.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    // A link wins over this tab's history: someone who was sent
    // "/catalog?genre=Drama" asked for exactly that, whatever they were
    // browsing here five minutes ago. Only when the address bar says nothing
    // do we fall back to the stored blob (IA-24's Back behaviour).
    const fromUrl = filtersFromQuery(window.location.search);
    let f: Partial<CatalogFilters> | null = fromUrl;
    if (!f) {
      try {
        const raw = sessionStorage.getItem(FILTERS_KEY);
        f = raw ? (JSON.parse(raw) as Partial<CatalogFilters>) : null;
      } catch {
        /* corrupt/blocked storage — fall back to defaults */
        f = null;
      }
    }
    if (!f) return;
    // A `?channel=` arrival wins over a stored channel selection (B5) — the
    // rest of the blob still restores normally underneath it.
    if (!initialChannel && Array.isArray(f.channels)) setSelectedChannels(f.channels);
    if (Array.isArray(f.genres)) setSelectedGenres(f.genres);
    if (Array.isArray(f.formats)) setSelectedFormats(f.formats);
    if (Array.isArray(f.platforms)) setSelectedPlatforms(f.platforms);
    if (Array.isArray(f.countries)) setSelectedCountries(f.countries);
    if (Array.isArray(f.placementTypes)) setSelectedPlacementTypes(f.placementTypes);
    if (Array.isArray(f.cities)) setSelectedCities(f.cities);
    if (typeof f.search === "string") setSearch(f.search);
    if (f.view === "grid" || f.view === "list") setView(f.view);
    if (f.sortBy && ["default", "newest", "deadline", "title"].includes(f.sortBy)) setSortBy(f.sortBy);
  }, [initialChannel]);

  useEffect(() => {
    // Skip the very first render so we don't clobber stored filters with the
    // empty defaults before the restore effect above has run.
    if (!restoredRef.current) return;
    try {
      sessionStorage.setItem(
        FILTERS_KEY,
        JSON.stringify({
          channels: selectedChannels,
          genres: selectedGenres,
          formats: selectedFormats,
          platforms: selectedPlatforms,
          countries: selectedCountries,
          placementTypes: selectedPlacementTypes,
          cities: selectedCities,
          search,
          view,
          sortBy,
        }),
      );
    } catch {
      /* storage blocked — persistence is best-effort */
    }
  }, [
    selectedChannels,
    selectedGenres,
    selectedFormats,
    selectedPlatforms,
    selectedCountries,
    selectedPlacementTypes,
    selectedCities,
    search,
    view,
    sortBy,
  ]);

  // …and mirror the same selection into the address bar, so a filtered
  // catalogue can be sent to someone. replaceState, not the router: this must
  // not re-run the server component, push a history entry per keystroke, or
  // scroll the page — it only rewrites what the address bar shows.
  useEffect(() => {
    if (!restoredRef.current) return;
    const query = filtersToQuery({
      channels: selectedChannels,
      genres: selectedGenres,
      formats: selectedFormats,
      platforms: selectedPlatforms,
      countries: selectedCountries,
      placementTypes: selectedPlacementTypes,
      cities: selectedCities,
      search,
      view,
      sortBy,
    });
    const next = `${window.location.pathname}${query}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [
    selectedChannels,
    selectedGenres,
    selectedFormats,
    selectedPlatforms,
    selectedCountries,
    selectedPlacementTypes,
    selectedCities,
    search,
    view,
    sortBy,
  ]);

  // Pagination resets to the first page whenever the result set could change
  // shape — any filter facet, the search term, or the sort order. Skipped on
  // the very first render (mirrors the guard above) so restoring a persisted
  // search doesn't clobber a resumed scroll position with page 1 anyway —
  // it's still page 1 by default, but keeps the two effects symmetric.
  // Adjusted during render, not from an effect: paginating the OLD page size
  // over the new result set for a frame is the visible glitch this prevents.
  const resultShapeKey = JSON.stringify([
    selectedChannels,
    selectedGenres,
    selectedFormats,
    selectedPlatforms,
    selectedCountries,
    selectedPlacementTypes,
    selectedCities,
    search,
    sortBy,
  ]);
  const [seenShapeKey, setSeenShapeKey] = useState(resultShapeKey);
  if (seenShapeKey !== resultShapeKey) {
    setSeenShapeKey(resultShapeKey);
    setVisibleCount(PAGE_SIZE);
  }

  // Count of active filter facets (excluding free-text search, which has its
  // own always-visible box) — shown as a badge on the mobile "Filters" button.
  const activeFilterCount =
    selectedChannels.length +
    selectedGenres.length +
    selectedFormats.length +
    selectedPlatforms.length +
    selectedCountries.length +
    selectedPlacementTypes.length +
    selectedCities.length;

  // Lock the page scroll behind the open filter sheet — through the shared
  // counter, so closing this sheet doesn't unlock the page while the burger
  // menu above it is still open (see body-scroll-lock.ts).
  useBodyScrollLock(filtersOpen);

  const hasFilters =
    selectedChannels.length > 0 ||
    selectedGenres.length > 0 ||
    selectedFormats.length > 0 ||
    selectedPlatforms.length > 0 ||
    selectedCountries.length > 0 ||
    selectedPlacementTypes.length > 0 ||
    selectedCities.length > 0 ||
    search !== "";

  const clearAll = () => {
    setSelectedChannels([]);
    setSelectedGenres([]);
    setSelectedFormats([]);
    setSelectedPlatforms([]);
    setSelectedCountries([]);
    setSelectedPlacementTypes([]);
    setSelectedCities([]);
    setSearch("");
  };

  // One toggle factory for every checkbox facet — flips a value in/out of the
  // given selection array.
  const makeToggle =
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (value: string) =>
      setter((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));

  const toggleChannel = makeToggle(setSelectedChannels);
  const toggleGenre = makeToggle(setSelectedGenres);
  const toggleFormat = makeToggle(setSelectedFormats);
  const togglePlatform = makeToggle(setSelectedPlatforms);
  const toggleCountry = makeToggle(setSelectedCountries);
  const togglePlacementType = makeToggle(setSelectedPlacementTypes);
  const toggleCity = makeToggle(setSelectedCities);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    // A project-only facet asks for something an ad space can never carry
    // (a genre, a platform, …), and City is the reverse — the one ad-space
    // facet. Either one active implies "only that kind" (plan B3: "a facet
    // of one kind implies its own kind"), which is what makes selecting a
    // genre also clear the billboards out of the list without a second
    // "kind" control anywhere in the UI.
    const isProjectFacetActive =
      selectedGenres.length > 0 ||
      selectedFormats.length > 0 ||
      selectedPlatforms.length > 0 ||
      selectedCountries.length > 0 ||
      selectedPlacementTypes.length > 0;
    const isCityFacetActive = selectedCities.length > 0;

    return channelFiltered.filter((row) => {
      if (row.kind === "AD_SPACE") {
        if (isProjectFacetActive) return false;
        const s = row.space;
        if (selectedCities.length > 0 && !selectedCities.includes(s.city)) return false;
        if (term && !row.haystack.includes(term)) return false;
        return true;
      }

      if (isCityFacetActive) return false;
      const p = row.project;
      if (selectedGenres.length > 0) {
        const gs = p.genres.length > 0 ? p.genres : [p.genre];
        if (!selectedGenres.some((s) => gs.includes(s))) return false;
      }
      // 5.8: formatCategory can legitimately be "" (deriveFormatCategory found
      // no match). With no format filter active (selectedFormats empty) these
      // rows pass through untouched — "all formats" really means all. Once a
      // filter IS active, "" only matches when the visitor explicitly ticked
      // the "Unspecified" bucket (its value is the empty string), so a blank
      // row never disappears silently — it just requires an explicit opt-in.
      if (selectedFormats.length > 0 && !selectedFormats.includes(p.formatCategory)) return false;
      if (selectedPlatforms.length > 0) {
        const pls = parseStringArray(p.platforms);
        if (!selectedPlatforms.some((s) => pls.includes(s))) return false;
      }

      if (selectedCountries.length > 0) {
        const cs = splitCountries(p.countries);
        if (!selectedCountries.some((s) => cs.includes(s))) return false;
      }

      // Integration kind (2026-08-10): a project matches if ANY of its
      // placements is one of the ticked kinds — same "some" semantics as the
      // genre and platform facets above. A project whose placements carry no
      // kind has an empty list and drops out once the facet is used, which is
      // the point: the visitor asked for a specific kind.
      if (selectedPlacementTypes.length > 0) {
        if (!selectedPlacementTypes.some((s) => p.placementTypes.includes(s))) return false;
      }

      if (term && !row.haystack.includes(term)) return false;

      return true;
    });
  }, [
    channelFiltered,
    selectedGenres,
    selectedFormats,
    selectedPlatforms,
    selectedCountries,
    selectedPlacementTypes,
    selectedCities,
    search,
  ]);

  // Only offer "Deadline soonest" when there's at least one project in the
  // visible set — same "no data, no control" rule as the facets. An
  // ad-space-only result (say, a BILLBOARD channel pick) has nothing this
  // sort could order.
  const hasProjectInResults = useMemo(() => filtered.some((r) => r.kind === "PROJECT"), [filtered]);

  // 5.7: re-sort the already-filtered list. "default" is a no-op — `filtered`
  // preserves the source array's order (Array.prototype.filter doesn't
  // reorder): projects in their own sortOrder, then ad spaces by channel and
  // sortOrder, because that's the order `rows` arrived in from the server and
  // nothing here reorders it.
  const sorted = useMemo(() => {
    if (sortBy === "default") return filtered;
    const list = [...filtered];
    if (sortBy === "newest") {
      // Recency desc: a project's releaseDate, an ad space's createdAt. Two
      // different things ("when the film comes out" vs. "when the listing
      // was added") sharing one axis — fine for ordering, not for math, so
      // don't reuse this value anywhere numbers get compared. Rows with no
      // timestamp (a project missing releaseDate) sink to the end.
      list.sort((a, b) => {
        const at =
          a.kind === "PROJECT"
            ? a.project.releaseDate
              ? new Date(a.project.releaseDate).getTime()
              : null
            : new Date(a.space.createdAt).getTime();
        const bt =
          b.kind === "PROJECT"
            ? b.project.releaseDate
              ? new Date(b.project.releaseDate).getTime()
              : null
            : new Date(b.space.createdAt).getTime();
        if (at === null) return bt === null ? 0 : 1;
        if (bt === null) return -1;
        return bt - at;
      });
    } else if (sortBy === "deadline") {
      // applicationDeadline asc (soonest first); an Ongoing project (IA-42)
      // sorts after every dated one, a project with no deadline sorts after
      // even that, and an ad space (no deadline concept at all) sorts in the
      // same "truly unset" bucket — see compareDeadline.
      list.sort((a, b) =>
        compareDeadline(
          a.kind === "PROJECT" ? a.project : { applicationDeadline: null, applicationDeadlineOngoing: false },
          b.kind === "PROJECT" ? b.project : { applicationDeadline: null, applicationDeadlineOngoing: false },
        ),
      );
    } else if (sortBy === "title") {
      list.sort((a, b) => a.title.localeCompare(b.title, intlLocale(locale)));
    }
    return list;
  }, [filtered, sortBy, locale]);

  // The client-side "page" currently on screen.
  const visible = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);
  const projectCount = useMemo(() => sorted.filter((r) => r.kind === "PROJECT").length, [sorted]);
  const adSpaceCount = sorted.length - projectCount;

  // Shared filter controls — rendered in the desktop sidebar AND the mobile
  // bottom-sheet, so the two never drift out of sync.
  const filterGroups = (
    <>
      {/* Channel — new top facet (2026-08-10): everything on offer, projects
          and ad spaces together. Only channels present anywhere in the
          catalog render, same "no data no facet" rule as the rest. */}
      {channelOptions.length > 0 ? (
        <CheckboxFilter
          label={t("catalog.channel")}
          options={channelOptions.map((c) => ({ value: c.code, label: t(`adChannel.${c.code}`) }))}
          selected={selectedChannels}
          onToggle={toggleChannel}
        />
      ) : null}

      {/* Guarded like Platform below, which these two weren't until 2026-08-10:
          while the catalog held nothing but films every film had a genre and a
          format, so the arrays were never empty. Pick the Billboards channel
          now and the result set is pure ad space — both came out as bare
          headers that open onto nothing. */}
      {genres.length > 0 ? (
        <CheckboxFilter
          label={t("catalog.genre")}
          options={genres.map((g) => ({ value: g, label: localize("genre", g) }))}
          selected={selectedGenres}
          onToggle={toggleGenre}
        />
      ) : null}

      {formatOptions.length > 0 || hasUnspecifiedFormat ? (
        <CheckboxFilter
          label={t("catalog.format")}
          options={[
            ...formatOptions.map((v) => ({
              value: v,
              label: localize("formatCategory", v),
            })),
            // 5.8: explicit opt-in bucket for formatCategory === "" — see the
            // filtering comment above for why this keeps those rows visible.
            ...(hasUnspecifiedFormat ? [{ value: "", label: t("catalog.formatUnspecified") }] : []),
          ]}
          selected={selectedFormats}
          onToggle={toggleFormat}
        />
      ) : null}

      {/* Platform only appears when the catalog actually carries such values —
          an empty facet would render a bare header with no options. The
          Country facet was removed on 2026-07-27 (content review); the state
          below still parses it from a saved/shared URL so old links keep
          working, it just isn't offered as a control. (The Language facet
          removed the same day was dropped for good on 2026-08-04, along with
          the Project.language column it read — see prisma/schema.prisma.) */}
      {platformOptions.length > 0 ? (
        <CheckboxFilter
          label={t("catalog.platform")}
          // QA-8: "Available on" mixes brand names ("Kinodaran", "YouTube" —
          // left as-is) with a few generic category words ("TV", "Cinema",
          // "Festivals"), which do get a label — same "label localizes, value
          // stays canonical" split as Genre/Format above.
          options={platformOptions.map((p) => ({ value: p, label: localize("platformCategory", p) }))}
          selected={selectedPlatforms}
          onToggle={togglePlatform}
        />
      ) : null}

      {/* Same "only when the data has it" rule as Platform above — until
          creators start classifying their placements this facet doesn't
          render at all. */}
      {placementTypeOptions.length > 0 ? (
        <CheckboxFilter
          label={t("catalog.placementType")}
          options={placementTypeOptions.map((v) => ({
            value: v,
            label: localize("placementType", v),
          }))}
          selected={selectedPlacementTypes}
          onToggle={togglePlacementType}
        />
      ) : null}

      {/* City — the one ad-space facet the rail carries (plan B3); see
          cityOptions above for why sizeFormat/reachPerDay aren't checkboxes. */}
      {cityOptions.length > 0 ? (
        <CheckboxFilter
          label={t("catalog.city")}
          // QA-8: same split as Genre/Format — the checkbox reads in the
          // visitor's language, filtering still compares the raw city value.
          options={cityOptions.map((c) => ({ value: c, label: localizeCity(locale, c) }))}
          selected={selectedCities}
          onToggle={toggleCity}
        />
      ) : null}
    </>
  );

  return (
    <>
      <Header user={user} locale={locale} currency={currency} />

      <PageHero
        eyebrow={t("nav.catalog")}
        title={t("catalog.heroTitle")}
        subtitle={t("catalog.heroSubtitle")}
        locale={locale}
      />

      <Container className="pt-8 pb-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          {/* Desktop sidebar — on mobile the filters move into a bottom-sheet */}
          <aside className="hidden lg:block">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t("catalog.filters")}
            </h2>
            {filterGroups}
            <div className="pt-4">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={clearAll}
                disabled={!hasFilters}
              >
                {t("catalog.clearAll")}
              </Button>
            </div>
          </aside>

          {/* Main content */}
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {/* Mobile "Filters" trigger — opens the bottom-sheet. Hidden on lg
                  where the sidebar is always visible. */}
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t("catalog.filters")}
                {activeFilterCount > 0 ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>

              <div className="relative flex-1 min-w-[220px]">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("catalog.searchPlaceholder")}
                  className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>

              {/* 5.7: sort control — reorders the already-filtered list
                  client-side, doesn't touch getProjects. */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label={t("catalog.sortLabel")}
                className="shrink-0 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="default">{t("catalog.sortDefault")}</option>
                <option value="newest">{t("catalog.sortNewest")}</option>
                {/* Nothing in the visible set has a deadline to sort by once
                    it's all ad spaces (B4) — same "no data, no control" rule
                    as the facets. */}
                {hasProjectInResults ? <option value="deadline">{t("catalog.sortDeadline")}</option> : null}
                <option value="title">{t("catalog.sortTitle")}</option>
              </select>

              <div className="inline-flex rounded-xl border border-border bg-card p-1">
                <button
                  type="button"
                  aria-label={t("catalog.gridView")}
                  onClick={() => setView("grid")}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg",
                    view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={t("catalog.listView")}
                  onClick={() => setView("list")}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg",
                    view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Both halves drop out at zero, and the bare prefix ("Показано")
                left behind reads as a truncated sentence — the empty-state
                block below already says there is nothing, so say it once. */}
            {projectCount + adSpaceCount > 0 && (
              <p className="mb-4 text-sm text-muted-foreground">
                {t("catalog.showingProjectsPrefix")}{" "}
                {/* Split count (plan B4) — a project and an ad space are too
                    different to lump into one number, and either half drops out
                    entirely once a channel pick leaves nothing of that kind. */}
                {[
                  projectCount > 0
                    ? t(`catalog.projectCount.${pluralForm(locale, projectCount)}`, { n: projectCount })
                    : null,
                  adSpaceCount > 0
                    ? t(`catalog.adSpaceCount.${pluralForm(locale, adSpaceCount)}`, { n: adSpaceCount })
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            {sorted.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
                {t("catalog.noResults")}
                {/* Filters survive a reload (sessionStorage, IA-24), so someone
                    coming back later meets an empty catalog with no visible
                    cause — on mobile the checked boxes sit inside a closed
                    sheet. The way out belongs next to the dead end. */}
                {hasFilters ? (
                  <div className="mt-6">
                    <Button type="button" variant="secondary" size="sm" onClick={clearAll}>
                      {t("catalog.clearAll")}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((row) =>
                  row.kind === "PROJECT" ? (
                    <ProjectCard
                      key={row.key}
                      project={row.project}
                      locale={locale}
                      user={user}
                      favorited={favorites.has(row.project.id)}
                      canFavorite={isBrand && !ownIds.has(row.project.id)}
                      isOwn={ownIds.has(row.project.id)}
                      signedIn={signedIn}
                    />
                  ) : (
                    <AdSpaceCard key={row.key} space={row.space} channelSlug={row.channelSlug} locale={locale} />
                  ),
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {visible.map((row) =>
                  row.kind === "PROJECT" ? (
                    <ProjectRow
                      key={row.key}
                      project={row.project}
                      locale={locale}
                      user={user}
                      favorited={favorites.has(row.project.id)}
                      canFavorite={isBrand && !ownIds.has(row.project.id)}
                      isOwn={ownIds.has(row.project.id)}
                      signedIn={signedIn}
                    />
                  ) : (
                    <AdSpaceRow key={row.key} space={row.space} channelSlug={row.channelSlug} locale={locale} />
                  ),
                )}
              </div>
            )}

            {/* 5.7: "Show more" pagination — grows the client-side page by
                PAGE_SIZE instead of rendering the whole catalog at once. */}
            {visibleCount < sorted.length ? (
              <div className="mt-8 flex justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                >
                  {t("catalog.loadMore")}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </Container>

      {/* Mobile filter bottom-sheet */}
      {filtersOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-base font-bold text-foreground">{t("catalog.filters")}</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label={t("nav.closeMenu")}
                className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* data-lenis-prevent: this sheet lives on the public catalog, where
                Lenis owns the wheel — without it the filter list can't scroll. */}
            <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
              {filterGroups}
            </div>
            <div className="flex items-center gap-3 border-t border-border p-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={clearAll}
                disabled={!hasFilters}
              >
                {t("catalog.clearAll")}
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                onClick={() => setFiltersOpen(false)}
              >
                {t("catalog.showResults")} {sorted.length}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {footer}
    </>
  );
}
