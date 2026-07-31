"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Film,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { GenreBadge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/project-card";
import { FavoriteHeart } from "@/components/favorite-heart";
import { Header, type SiteHeaderUser } from "@/components/header";
import { daysUntil, formatFullDate, parseStringArray, splitCountries } from "@/lib/data/format";
import { FORMAT_CATEGORY_VALUES } from "@/app/admin/(panel)/projects/form-shared";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, intlLocale, makeUI, useLocalizer, type Locale } from "@/lib/i18n-client";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currency";
import type { ProjectListDTO } from "@/lib/types";

type ViewMode = "grid" | "list";

// 5.7: "default" keeps the source order (sortOrder, as getProjects returns
// it) — the other three re-sort the already-filtered list client-side.
type SortOption = "default" | "newest" | "deadline" | "title";

// Cards per "page" — the client-side pagination reveals results in chunks of
// this size instead of rendering the whole (small but growing) catalog at
// once. 12 = 4 full rows of 3 in the grid view.
const PAGE_SIZE = 12;

function ProjectRow({
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
  const t = makeUI(locale);
  // One hook call up front — shownExtraGenres.map() below (variable-length,
  // depends on the project) calls this per item; localizeValue() itself
  // reads context and can't be called inside a loop.
  const localize = useLocalizer(locale);
  const countries = splitCountries(project.countries);
  const deadlineDays = daysUntil(project.applicationDeadline);
  const deadlineUrgent = deadlineDays !== null && deadlineDays <= 45;
  // 5.6: same "first + up to 2 more, then +N" convention as ProjectCard.
  const allGenres = project.genres.length > 0 ? project.genres : [project.genre];
  const extraGenres = allGenres.slice(1);
  const shownExtraGenres = extraGenres.slice(0, 2);
  const moreGenres = extraGenres.length - shownExtraGenres.length;
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
        <FavoriteHeart
          projectId={project.id}
          initialFavorite={favorited}
          canFavorite={canFavorite}
          signedIn={signedIn}
          addAria={t("favorite.addAria")}
          removeAria={t("favorite.removeAria")}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{project.title}</h3>
          <GenreBadge>{localize("genre", allGenres[0])}</GenreBadge>
          {shownExtraGenres.map((g) => (
            <GenreBadge key={g}>{localize("genre", g)}</GenreBadge>
          ))}
          {moreGenres > 0 ? <GenreBadge>+{moreGenres}</GenreBadge> : null}
        </div>
        <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">{project.synopsis}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{project.format}</span>
          <span>{countries.slice(0, 3).join(", ")}</span>
          {project.applicationDeadline ? (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                deadlineUrgent ? "text-warn" : undefined,
              )}
            >
              <Clock className="h-3 w-3 shrink-0" />
              {t("catalog.until")} {formatFullDate(project.applicationDeadline, intlLocale(locale))}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:gap-3">
        <Button asChild variant="primary" size="sm" className="w-full sm:w-auto">
          <Link href={`/reports/${project.id}`}>{t("btn.viewReport")}</Link>
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
  projects,
  locale = DEFAULT_LOCALE,
  currency = DEFAULT_CURRENCY,
  user = null,
  favorites = new Set(),
  signedIn = false,
  isBrand = false,
  footer,
}: {
  projects: ProjectListDTO[];
  locale?: Locale;
  currency?: CurrencyCode;
  user?: SiteHeaderUser | null;
  /** projectIds the current BRAND visitor has favorited (#22) — empty for
   *  guests/non-brand members, which renders every heart outline/inert. */
  favorites?: Set<number>;
  signedIn?: boolean;
  isBrand?: boolean;
  /** <Footer/>, rendered by the server page (catalog/page.tsx) and passed
   *  down instead of imported here — Footer is a plain Server Component used
   *  by many pure-server pages (bundle audit 2026-07-31); importing it
   *  directly into this Client Component would force it into every page's
   *  client bundle, not just this one. */
  footer: ReactNode;
}) {
  const t = makeUI(locale);
  // One hook call up front — genres.map()/FORMAT_CATEGORY_VALUES.map() below
  // call this per item; localizeValue() itself reads context and can't be
  // called inside a loop.
  const localize = useLocalizer(locale);
  // 5.6: the genre facet (and the filter match below) now considers every
  // genre a project carries, not just genres[0] — a project tagged
  // Comedy+Drama should surface under either filter, not just the first.
  const genres = useMemo(
    () =>
      Array.from(
        new Set(projects.flatMap((p) => (p.genres.length > 0 ? p.genres : [p.genre]))),
      ).sort(),
    [projects],
  );
  // 5.8: only offer the "Unspecified" format bucket when the catalog actually
  // has a row with an empty formatCategory — same pattern as platform/country
  // below, so the checkbox never appears with nothing behind it.
  const hasUnspecifiedFormat = useMemo(
    () => projects.some((p) => !p.formatCategory),
    [projects],
  );
  // Formats actually present in the catalog, kept in FORMAT_CATEGORY_VALUES
  // order rather than sorted: that order is editorial (Feature film → Series →
  // Mini-series → …), and alphabetising it would scatter related buckets.
  //
  // This used to render the whole closed set — twelve checkboxes over a catalog
  // holding three formats, nine of which filtered to nothing (owner report
  // 2026-07-31).
  const formatOptions = useMemo(() => {
    const present = new Set(projects.map((p) => p.formatCategory).filter(Boolean));
    return FORMAT_CATEGORY_VALUES.filter((v) => present.has(v));
  }, [projects]);
  // Distinct platforms / countries actually present across the projects.
  const platformOptions = useMemo(
    () => Array.from(new Set(projects.flatMap((p) => parseStringArray(p.platforms)))).sort(),
    [projects],
  );
  const countryOptions = useMemo(
    () => Array.from(new Set(projects.flatMap((p) => splitCountries(p.countries)))).sort(),
    [projects],
  );

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("default");
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
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = sessionStorage.getItem(FILTERS_KEY);
      if (!raw) return;
      const f = JSON.parse(raw);
      if (Array.isArray(f.genres)) setSelectedGenres(f.genres);
      if (Array.isArray(f.formats)) setSelectedFormats(f.formats);
      if (Array.isArray(f.languages)) setSelectedLanguages(f.languages);
      if (Array.isArray(f.platforms)) setSelectedPlatforms(f.platforms);
      if (Array.isArray(f.countries)) setSelectedCountries(f.countries);
      if (typeof f.search === "string") setSearch(f.search);
      if (f.view === "grid" || f.view === "list") setView(f.view);
      if (["default", "newest", "deadline", "title"].includes(f.sortBy)) setSortBy(f.sortBy);
    } catch {
      /* corrupt/blocked storage — fall back to defaults */
    }
  }, []);

  useEffect(() => {
    // Skip the very first render so we don't clobber stored filters with the
    // empty defaults before the restore effect above has run.
    if (!restoredRef.current) return;
    try {
      sessionStorage.setItem(
        FILTERS_KEY,
        JSON.stringify({
          genres: selectedGenres,
          formats: selectedFormats,
          languages: selectedLanguages,
          platforms: selectedPlatforms,
          countries: selectedCountries,
          search,
          view,
          sortBy,
        }),
      );
    } catch {
      /* storage blocked — persistence is best-effort */
    }
  }, [
    selectedGenres,
    selectedFormats,
    selectedLanguages,
    selectedPlatforms,
    selectedCountries,
    search,
    view,
    sortBy,
  ]);

  // Pagination resets to the first page whenever the result set could change
  // shape — any filter facet, the search term, or the sort order. Skipped on
  // the very first render (mirrors the guard above) so restoring a persisted
  // search doesn't clobber a resumed scroll position with page 1 anyway —
  // it's still page 1 by default, but keeps the two effects symmetric.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    selectedGenres,
    selectedFormats,
    selectedLanguages,
    selectedPlatforms,
    selectedCountries,
    search,
    sortBy,
  ]);

  // Count of active filter facets (excluding free-text search, which has its
  // own always-visible box) — shown as a badge on the mobile "Filters" button.
  const activeFilterCount =
    selectedGenres.length +
    selectedFormats.length +
    selectedLanguages.length +
    selectedPlatforms.length +
    selectedCountries.length;

  // Lock the page scroll behind the open filter sheet.
  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersOpen]);

  const hasFilters =
    selectedGenres.length > 0 ||
    selectedFormats.length > 0 ||
    selectedLanguages.length > 0 ||
    selectedPlatforms.length > 0 ||
    selectedCountries.length > 0 ||
    search !== "";

  const clearAll = () => {
    setSelectedGenres([]);
    setSelectedFormats([]);
    setSelectedLanguages([]);
    setSelectedPlatforms([]);
    setSelectedCountries([]);
    setSearch("");
  };

  // One toggle factory for every checkbox facet — flips a value in/out of the
  // given selection array.
  const makeToggle =
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (value: string) =>
      setter((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));

  const toggleGenre = makeToggle(setSelectedGenres);
  const toggleFormat = makeToggle(setSelectedFormats);
  const toggleLanguage = makeToggle(setSelectedLanguages);
  const togglePlatform = makeToggle(setSelectedPlatforms);
  const toggleCountry = makeToggle(setSelectedCountries);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    let list = projects.filter((p) => {
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
      if (selectedLanguages.length > 0) {
        // Language is now a CSV of one or more values (admin redesign phase 1,
        // was a single select) — match if ANY of the project's languages is
        // in the selected filter set.
        const langs = splitCountries(p.language);
        if (!selectedLanguages.some((s) => langs.includes(s))) return false;
      }
      if (selectedPlatforms.length > 0) {
        const pls = parseStringArray(p.platforms);
        if (!selectedPlatforms.some((s) => pls.includes(s))) return false;
      }

      if (selectedCountries.length > 0) {
        const cs = splitCountries(p.countries);
        if (!selectedCountries.some((s) => cs.includes(s))) return false;
      }

      if (term) {
        const haystack = `${p.title} ${p.genre} ${p.countries} ${p.synopsis}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });

    return list;
  }, [
    projects,
    selectedGenres,
    selectedFormats,
    selectedLanguages,
    selectedPlatforms,
    selectedCountries,
    search,
  ]);

  // 5.7: re-sort the already-filtered list. "default" is a no-op — `filtered`
  // preserves the source array's order (Array.prototype.filter doesn't
  // reorder), which is exactly the sortOrder the projects arrive in.
  const sorted = useMemo(() => {
    if (sortBy === "default") return filtered;
    const list = [...filtered];
    if (sortBy === "newest") {
      // releaseDate desc, projects with no release date sink to the end.
      list.sort((a, b) => {
        const at = a.releaseDate ? new Date(a.releaseDate).getTime() : null;
        const bt = b.releaseDate ? new Date(b.releaseDate).getTime() : null;
        if (at === null) return bt === null ? 0 : 1;
        if (bt === null) return -1;
        return bt - at;
      });
    } else if (sortBy === "deadline") {
      // applicationDeadline asc (soonest first), no-deadline projects last.
      list.sort((a, b) => {
        const at = a.applicationDeadline ? new Date(a.applicationDeadline).getTime() : null;
        const bt = b.applicationDeadline ? new Date(b.applicationDeadline).getTime() : null;
        if (at === null) return bt === null ? 0 : 1;
        if (bt === null) return -1;
        return at - bt;
      });
    } else if (sortBy === "title") {
      list.sort((a, b) => a.title.localeCompare(b.title, intlLocale(locale)));
    }
    return list;
  }, [filtered, sortBy, locale]);

  // The client-side "page" currently on screen.
  const visible = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);

  // Shared filter controls — rendered in the desktop sidebar AND the mobile
  // bottom-sheet, so the two never drift out of sync.
  const filterGroups = (
    <>
      <CheckboxFilter
        label={t("catalog.genre")}
        options={genres.map((g) => ({ value: g, label: localize("genre", g) }))}
        selected={selectedGenres}
        onToggle={toggleGenre}
      />

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

      {/* Platform only appears when the catalog actually carries such values —
          an empty facet would render a bare header with no options. The
          Language and Country facets were removed on 2026-07-27 (content
          review); the state below still parses them from a saved/shared URL so
          old links keep working, it just isn't offered as a control. */}
      {platformOptions.length > 0 ? (
        <CheckboxFilter
          label={t("catalog.platform")}
          options={platformOptions.map((p) => ({ value: p, label: p }))}
          selected={selectedPlatforms}
          onToggle={togglePlatform}
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
                <option value="deadline">{t("catalog.sortDeadline")}</option>
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

            <p className="mb-4 text-sm text-muted-foreground">
              {t("catalog.showingProjectsPrefix")}{" "}
              <span className="font-semibold text-foreground">{sorted.length}</span>{" "}
              {sorted.length === 1 ? t("catalog.projectSingular") : t("catalog.projectPlural")}
            </p>

            {sorted.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
                {t("catalog.noResults")}
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    locale={locale}
                    user={user}
                    favorited={favorites.has(project.id)}
                    canFavorite={isBrand}
                    signedIn={signedIn}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {visible.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    locale={locale}
                    user={user}
                    favorited={favorites.has(project.id)}
                    canFavorite={isBrand}
                    signedIn={signedIn}
                  />
                ))}
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
