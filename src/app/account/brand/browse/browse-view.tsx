"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search, Sparkles, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/project-card";
import { splitCountries } from "@/lib/data/format";
import { FORMAT_CATEGORY_VALUES } from "@/app/admin/(panel)/projects/form-shared";
import { DEFAULT_LOCALE, useUI, useLocalizer, type Locale } from "@/lib/i18n-client";
import type { ProjectListDTO } from "@/lib/types";

/** One checkbox facet group — shared by every filter below (4.4). Simplified
 *  copy of catalog-view.tsx's CheckboxFilter (not imported: that component is
 *  a non-exported local, and catalog-view.tsx is being edited concurrently by
 *  another agent — duplicating a dozen lines is cheaper than coupling to it). */
function CheckboxFilter({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(true);
  if (options.length === 0) return null;
  return (
    <div className="pb-3">
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

export function BrowseView({
  projects,
  favorites,
  locale = DEFAULT_LOCALE,
  title,
}: {
  projects: ProjectListDTO[];
  /** projectIds the brand has favorited (heart's initial filled state). */
  favorites: Set<number>;
  locale?: Locale;
  title: string;
}) {
  const t = useUI(locale);
  // One hook call up front — FORMAT_CATEGORY_VALUES.map() below calls this
  // per item; localizeValue() itself reads context and can't be called
  // inside a loop.
  const localize = useLocalizer(locale);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // 4.4 — parity with the public /catalog filter set (format, country,
  // production stage), plus a brand-only "open slots" toggle. Genre is
  // deliberately left out of this pass — the card already surfaces it via
  // the GenreBadge and the free-text search already matches on it.
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [slotsOnly, setSlotsOnly] = useState(false);

  // Every facet offers only values actually present among the listed projects
  // — same rule as the public catalog. Format keeps FORMAT_CATEGORY_VALUES
  // order (editorial, not alphabetical) rather than being sorted.
  const formatOptions = useMemo(() => {
    const present = new Set(projects.map((p) => p.formatCategory).filter(Boolean));
    return FORMAT_CATEGORY_VALUES.filter((v) => present.has(v));
  }, [projects]);
  const countryOptions = useMemo(
    () => Array.from(new Set(projects.flatMap((p) => splitCountries(p.countries)))).sort(),
    [projects],
  );

  const makeToggle =
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (value: string) =>
      setter((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  const toggleFormat = makeToggle(setSelectedFormats);
  const toggleCountry = makeToggle(setSelectedCountries);

  const activeFilterCount = selectedFormats.length + selectedCountries.length + (slotsOnly ? 1 : 0);

  const hasFilters = activeFilterCount > 0;
  const clearAll = () => {
    setSelectedFormats([]);
    setSelectedCountries([]);
    setSlotsOnly(false);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (selectedFormats.length > 0 && !selectedFormats.includes(p.formatCategory)) return false;
      if (selectedCountries.length > 0) {
        const cs = splitCountries(p.countries);
        if (!selectedCountries.some((s) => cs.includes(s))) return false;
      }
      // "Open slots" = the same condition the catalog card's "X / Y placements
      // available" indicator already relies on (slotsTotal>0 means at least
      // one tier has a total set at all; slotsAvailable>0 means some of that
      // capacity is still unclaimed).
      if (slotsOnly && !(p.slotsTotal > 0 && p.slotsAvailable > 0)) return false;
      if (term && !`${p.title} ${p.genre} ${p.countries} ${p.synopsis}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [projects, search, selectedFormats, selectedCountries, slotsOnly]);

  // The Country facet's UI control was removed 2026-07-27 (content review) —
  // the filter state stays so nothing downstream has to change shape.
  const filterGroups = (
    <>
      <CheckboxFilter
        label={t("catalog.format")}
        options={formatOptions.map((v) => ({ value: v, label: localize("formatCategory", v) }))}
        selected={selectedFormats}
        onToggle={toggleFormat}
      />
      <div className="pb-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <input
            type="checkbox"
            checked={slotsOnly}
            onChange={(e) => setSlotsOnly(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          {t("account.brand.slotsAvailableOnly")}
        </label>
      </div>
    </>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">{title}</h1>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("catalog.searchPlaceholder")}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("account.brand.filtersToggle")}
          {activeFilterCount > 0 ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* Inline disclosure panel rather than a second permanent sidebar — the
          cabinet already spends its width on BrandSidebar, so a catalog-style
          240px filter rail would cramp the (narrower, max-w-[1200px]) content
          column. Opens on demand instead, same filter groups either way. */}
      {filtersOpen ? (
        <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-1 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
          {filterGroups}
          <div className="col-span-full pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={clearAll} disabled={!hasFilters}>
              {t("catalog.clearAll")}
            </Button>
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-16 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">{t("catalog.noResults")}</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {/* The very same card the public catalog uses. The cabinet had its
              own stripped copy — title, format, countries, deadline and a
              text-looking ghost link — so a brand browsing from inside its
              account saw less about a project than a stranger does on the
              storefront: no extra genres, no free-slot count, no placement
              count, no release date, no platforms, and no whole-card click
              target. Sharing the component is also what keeps the two from
              drifting apart again. */}
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              locale={locale}
              favorited={favorites.has(project.id)}
              // A brand is signed in by definition here — the heart is live,
              // never the "sign in to save" stub.
              canFavorite
              signedIn
            />
          ))}
        </div>
      )}
    </div>
  );
}
