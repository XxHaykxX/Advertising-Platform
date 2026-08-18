"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  filtersFromQuery,
  filtersToQuery,
  type CatalogFilters,
} from "./ads-url-state";
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
import { GenreBadge, AccentBadge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/project-card";
import { AdSpaceCard } from "@/components/ad-space-card";
import { FavoriteHeart } from "@/components/favorite-heart";
// Type-only: the ProjectCard/ProjectRow below need the shape, and an
// `import type` is erased — the header itself never reaches this bundle.
import type { SiteHeaderUser } from "@/components/header";
import { compareDeadline, daysUntil, formatFullDate, splitCountries } from "@/lib/data/format";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/lib/body-scroll-lock";
import { DEFAULT_LOCALE, intlLocale, useUI, useLocalizer, type Locale } from "@/lib/i18n-client";
import { NO_OFFER_KEY } from "@/lib/offer-value";
import { findAdChannel } from "@/lib/ad-channels";
import { adSpacePath } from "@/lib/ad-space-url";
import { pluralForm } from "@/lib/plural";
import { FACETS, facetsFor, type FacetContext } from "@/lib/catalog/facets";
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
 *  sort, the channel facet — need to agree on. Built server-side by
 *  projectToRow/spaceToRow (ads/rows.ts) — /ads/page.tsx builds the full list,
 *  /ads/[channel]/page.tsx builds one channel's rows the same way, so
 *  `channels` and `haystack` never need recomputing on the client. */
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

// Pulled out once, not looked up per render — used to narrow the OTHER
// facets' option lists to the picked channel (see channelFiltered below).
const CHANNEL_FACET = FACETS.find((f) => f.key === "channel")!;

export function AdsView({
  rows,
  channelCodes,
  locale = DEFAULT_LOCALE,
  user = null,
  favorites = new Set(),
  ownIds = new Set(),
  signedIn = false,
  isBrand = false,
}: {
  /** This page's inventory, already narrowed to `channelCodes` by the server
   *  page — see CatalogRow above. Never the whole marketplace: the one page
   *  that listed everything at once (/ads) was removed 2026-08-18. */
  rows: CatalogRow[];
  /** The channels this render covers: one on a channel page, two or three on a
   *  group page. Drives which facets are offered (facetsFor) and whether the
   *  Channel facet appears at all — see renderableFacets below. */
  channelCodes: readonly string[];
  locale?: Locale;
  user?: SiteHeaderUser | null;
  /** projectIds the current BRAND visitor has favorited (#22) — empty for
   *  guests/non-brand members, which renders every heart outline/inert. */
  favorites?: Set<number>;
  /** projectIds the current visitor OWNS (2026-08-11, dual-side accounts) —
   *  same shape as `favorites`; a dual member can't apply/favorite their own
   *  listing, so its card renders with neither. Empty for anyone who can't
   *  sell — see ads/page.tsx. */
  ownIds?: Set<number>;
  signedIn?: boolean;
  isBrand?: boolean;
}) {
  // ponytail: the whole catalog is serialized to the client and filtered/sorted
  // there — fine at a few hundred rows, move to searchParams-driven server
  // filtering once it stops being fine.
  const t = useUI(locale);
  // One hook call up front — a facet's optionLabel() below calls this per
  // item; localizeValue() itself reads context and can't be called inside a
  // loop.
  const localize = useLocalizer(locale);
  const ctx: FacetContext = { locale, t, localize };

  // One selection array per facet key (facets.ts), replacing what used to be
  // seven separate useState hooks — adding a facet there is now enough, no
  // matching state/toggle/effect-dependency edit needed here.
  const [selected, setSelected] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const f of FACETS) init[f.key] = [];
    return init;
  });
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("default");

  // Rows that survive the channel facet alone — every other facet's option
  // list is derived from THIS, not from `rows` and not from the fully
  // filtered set: picking BILLBOARD should narrow which genres show (there
  // are none), but picking Comedy must not make BILLBOARD itself disappear
  // from the channel checkboxes. (The channel facet's own options opt out of
  // this via optionsScope: "rows" — see facets.ts.)
  // Which channels this page can actually switch between, and which of them the
  // visitor has picked. The selection is section-wide (sessionStorage), so it
  // routinely carries codes from another page — those are dropped here rather
  // than filtering everything away, see offeredFacets.
  const channelValues = useMemo(
    () => (channelCodes.length > 1 ? ((CHANNEL_FACET.options?.(rows, ctx) ?? []) as string[]) : []),
    // ctx is rebuilt every render; only the locale inside it matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, channelCodes, locale],
  );
  const pickedChannels = useMemo(
    () => (selected.channel ?? []).filter((c) => channelValues.includes(c)),
    [selected.channel, channelValues],
  );

  const channelFiltered = useMemo(
    () => (pickedChannels.length === 0 ? rows : rows.filter((r) => CHANNEL_FACET.matches(r, pickedChannels))),
    [rows, pickedChannels],
  );

  // The facets this page actually puts in front of the visitor: the ALL ones
  // plus whatever is scoped to these channels (facetsFor), the Channel switcher
  // on a group page, and only those with something to offer — "no data, no
  // facet" is the rule every facet in facets.ts already follows when it builds
  // options from the rows on hand. Each entry carries its option list and the
  // part of the selection that is actually IN that list (`picked`).
  //
  // Both narrowings exist for the same reason. The selection is section-wide
  // (sessionStorage), so it arrives here holding whatever was picked on some
  // other page:
  //   - a facet this page doesn't offer at all (Channel on a single-channel
  //     page) would filter invisibly;
  //   - a value this page's facet doesn't list (BILLBOARD on /ads/sponsorship)
  //     would filter everything away while every chip reads unselected.
  // Both used to leave the visitor on an empty page with nothing on screen to
  // undo. A filter that can't be seen is a filter that can't be cleared, so it
  // doesn't get to filter.
  //
  // `hidden` facets (country) stay in this list — they filter, they just never
  // render; renderableFacets below drops them for display only.
  const offeredFacets = useMemo(() => {
    const applicable = [
      ...(channelCodes.length > 1 ? [CHANNEL_FACET] : []),
      ...facetsFor(channelCodes),
    ];
    return applicable.flatMap((f) => {
      const source = f.optionsScope === "rows" ? rows : channelFiltered;
      const values = (f.options?.(source, ctx) ?? []) as string[];
      if (values.length === 0) return [];
      const picked = (selected[f.key] ?? []).filter((v) => values.includes(v));
      return [{ facet: f, values, picked }];
    });
    // ctx is rebuilt every render (it closes over t/localize) — depending on it
    // would defeat the memo, and its contents only change with the locale,
    // which remounts the page anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, channelFiltered, channelCodes, locale, selected]);

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
  // churn); "Clear all" naturally overwrites it with the empty state. Shared
  // by both modes — a genre picked on a channel page should still be there
  // back on the full /ads list, same as picking it there in the first place.
  const FILTERS_KEY = "catalog:filters";
  const restoredRef = useRef(false);
  // Has to be an effect: neither the URL nor sessionStorage exists during the
  // server render, so a stored/linked selection can only be applied after
  // mount.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    // A link wins over this tab's history: someone who was sent
    // "/ads?genre=Drama" asked for exactly that, whatever they were
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
    // `f.facets` is undefined for an old-shape stored blob (the seven named
    // plural fields this used to be, before facets became data-driven) —
    // skipped rather than migrated, same as any other garbage in storage.
    if (f.facets && typeof f.facets === "object") {
      const next: Record<string, string[]> = {};
      for (const fct of FACETS) next[fct.key] = [];
      for (const [key, values] of Object.entries(f.facets)) {
        if (!Array.isArray(values) || !(key in next)) continue;
        next[key] = values;
      }
      setSelected(next);
    }
    if (typeof f.search === "string") setSearch(f.search);
    if (f.view === "grid" || f.view === "list") setView(f.view);
    if (f.sortBy && ["default", "newest", "deadline", "title"].includes(f.sortBy)) setSortBy(f.sortBy);
  }, []);

  useEffect(() => {
    // Skip the very first render so we don't clobber stored filters with the
    // empty defaults before the restore effect above has run.
    if (!restoredRef.current) return;
    try {
      sessionStorage.setItem(FILTERS_KEY, JSON.stringify({ facets: selected, search, view, sortBy }));
    } catch {
      /* storage blocked — persistence is best-effort */
    }
  }, [selected, search, view, sortBy]);

  // …and mirror the same selection into the address bar, so a filtered
  // catalogue can be sent to someone. replaceState, not the router: this must
  // not re-run the server component, push a history entry per keystroke, or
  // scroll the page — it only rewrites what the address bar shows.
  useEffect(() => {
    if (!restoredRef.current) return;
    // Only the facets this page offers reach the address bar. The selection
    // itself is section-wide (sessionStorage), so a channel picked on
    // /ads/outdoor is still in state when /ads/lifts renders — writing it into
    // that page's URL produced "/ads/lifts?channel=BILLBOARD", a link that
    // advertises a filter the page neither shows nor applies.
    const shown: Record<string, string[]> = {};
    for (const { facet, picked } of offeredFacets) {
      if (picked.length > 0) shown[facet.key] = picked;
    }
    const query = filtersToQuery({ facets: shown, search, view, sortBy });
    const next = `${window.location.pathname}${query}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [selected, search, view, sortBy, offeredFacets]);

  // Pagination resets to the first page whenever the result set could change
  // shape — any filter facet, the search term, or the sort order. Skipped on
  // the very first render (mirrors the guard above) so restoring a persisted
  // search doesn't clobber a resumed scroll position with page 1 anyway —
  // it's still page 1 by default, but keeps the two effects symmetric.
  // Adjusted during render, not from an effect: paginating the OLD page size
  // over the new result set for a frame is the visible glitch this prevents.
  const resultShapeKey = JSON.stringify([selected, search, sortBy]);
  const [seenShapeKey, setSeenShapeKey] = useState(resultShapeKey);
  if (seenShapeKey !== resultShapeKey) {
    setSeenShapeKey(resultShapeKey);
    setVisibleCount(PAGE_SIZE);
  }

  // Count of active filter facets (excluding free-text search, which has its
  // own always-visible box) — shown as a badge on the mobile "Filters" button
  // and what enables "Clear all". Counts only what this page offers, for the
  // same reason `filtered` applies only those: a stored selection for a facet
  // that isn't on screen is neither filtering nor clearable, and counting it
  // would put a number on the badge with nothing behind it.
  const activeFilterCount = offeredFacets.reduce((sum, { picked }) => sum + picked.length, 0);

  // Lock the page scroll behind the open filter sheet — through the shared
  // counter, so closing this sheet doesn't unlock the page while the burger
  // menu above it is still open (see body-scroll-lock.ts).
  useBodyScrollLock(filtersOpen);

  const hasFilters = activeFilterCount > 0 || search !== "";

  const clearAll = () => {
    setSelected((prev) => {
      const next: Record<string, string[]> = {};
      for (const key of Object.keys(prev)) next[key] = [];
      return next;
    });
    setSearch("");
  };

  // One toggle for every checkbox facet — flips a value in/out of that
  // facet's selection array.
  const toggle = (key: string, value: string) =>
    setSelected((prev) => {
      const cur = prev[key] ?? [];
      return { ...prev, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    // A row that fails any facet THIS PAGE OFFERS drops out — including a
    // facet the row's own kind can never carry (a genre on an ad space, a city
    // on a project), which is what makes picking a genre also clear the
    // billboards out of a mixed list without a separate "kind" control
    // anywhere in the UI (plan B3). See each facet's matches() in facets.ts.
    //
    // "offers" and not "has a value for" is the load-bearing part: the
    // selection is shared across the whole section via sessionStorage, so
    // picking Billboards on /ads/outdoor and then opening /ads/radio used to
    // hand the radio page a channel filter it never rendered — every row
    // failed it and the page came up empty with nothing on screen to explain
    // why, only an enabled "Clear all". A filter the visitor cannot see is a
    // filter they cannot undo.
    return rows.filter((row) => {
      for (const { facet, picked } of offeredFacets) {
        if (picked.length > 0 && !facet.matches(row, picked)) return false;
      }
      return !term || row.haystack.includes(term);
    });
  }, [rows, search, offeredFacets]);

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

  // One place each for the grid/list card of a row — used to be a
  // `row.kind === "PROJECT" ? … : …` ternary repeated in both layouts below.
  function renderCard(row: CatalogRow) {
    return row.kind === "PROJECT" ? (
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
    );
  }
  function renderRow(row: CatalogRow) {
    return row.kind === "PROJECT" ? (
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
    );
  }

  // Which facets this render offers: the ALL ones plus whatever is scoped to
  // the channels on this page — see facetsFor(). The Channel facet is added
  // back on top only for a group page, where it works as a switcher between
  // the group's channels; on a single channel it would be one always-checked
  // box. `hidden` facets (country) filter but never render.
  // `hidden` facets (country) filter but never render. Channel is dropped from
  // the sidebar too when the chips above the results are showing it: the two
  // drove the same selection, so a group page carried the same control twice,
  // once as chips and once as checkboxes a scroll away.
  const renderableFacets = offeredFacets.filter(
    ({ facet }) => !facet.hidden && !(facet.key === "channel" && channelValues.length > 1),
  );

  // The chips above the results (group pages only). Built from the rows on
  // hand, not from channelCodes: a group whose third channel has nothing
  // listed shouldn't offer a chip that filters everything away. Same "no data,
  // no control" rule the facets follow.
  const channelChips = channelValues;

  // Shared filter controls — rendered in the desktop sidebar AND the mobile
  // bottom-sheet, so the two never drift out of sync. The option lists are
  // already built (offeredFacets), and an empty one never got that far.
  const filterGroups = (
    <>
      {/* `picked`, not the raw selection: the boxes must tick exactly what is
          filtering, and the raw one can hold values this page doesn't list. */}
      {renderableFacets.map(({ facet: f, values, picked }) => (
        <CheckboxFilter
          key={f.key}
          label={f.label ? f.label(ctx) : f.key}
          options={values.map((v) => ({ value: v, label: f.optionLabel ? f.optionLabel(v, ctx) : v }))}
          selected={picked}
          onToggle={(value) => toggle(f.key, value)}
        />
      ))}
    </>
  );

  return (
    <>
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
            {/* Channel switcher — a group page only. The Channel facet in the
                sidebar drives the same selection, but on mobile that sidebar
                is a sheet behind a button, and switching between a group's own
                channels is the one filter worth reaching without opening it.
                Chips over tabs: the selection is a multi-select (the facet
                below can hold two of three), and tabs that allow two actives
                read as broken. */}
            {channelChips.length > 1 ? (
              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelected((s) => ({ ...s, channel: [] }))}
                  aria-pressed={pickedChannels.length === 0}
                  className={cn(
                    "rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                    pickedChannels.length === 0
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary",
                  )}
                >
                  {t("ads.allChannels")}
                </button>
                {channelChips.map((code) => {
                  const active = pickedChannels.includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggle("channel", code)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary",
                      )}
                    >
                      {t(`adChannel.${code}`)}
                    </button>
                  );
                })}
              </div>
            ) : null}

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
                  placeholder={t("ads.searchPlaceholder")}
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
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">{visible.map(renderCard)}</div>
            ) : (
              <div className="flex flex-col gap-4">{visible.map(renderRow)}</div>
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
    </>
  );
}
