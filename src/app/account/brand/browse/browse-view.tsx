"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronRight, Clock, Film, MapPin, Search, Sparkles, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenreBadge } from "@/components/ui/badge";
import { FavoriteHeart } from "@/components/favorite-heart";
import { daysUntil, formatFullDate, splitCountries } from "@/lib/data/format";
import { FORMAT_CATEGORY_VALUES, LANGUAGE_VALUES } from "@/app/admin/(panel)/projects/form-shared";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, intlLocale, localizeValue, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectListDTO } from "@/lib/types";

function BrowseCard({
  project,
  favorited,
  locale,
  onRequestLabel,
  favoriteAddAria,
  favoriteRemoveAria,
  untilLabel,
}: {
  project: ProjectListDTO;
  favorited: boolean;
  locale: Locale;
  onRequestLabel: string;
  favoriteAddAria: string;
  favoriteRemoveAria: string;
  untilLabel: string;
}) {
  const countries = splitCountries(project.countries);
  const deadlineDays = daysUntil(project.applicationDeadline);
  const deadlineUrgent = deadlineDays !== null && deadlineDays <= 45;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card card-lift">
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
        <div className="absolute left-3 top-3">
          <GenreBadge>{localizeValue(locale, "genre", project.genre)}</GenreBadge>
        </div>
        <FavoriteHeart
          projectId={project.id}
          initialFavorite={favorited}
          canFavorite
          signedIn
          addAria={favoriteAddAria}
          removeAria={favoriteRemoveAria}
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-foreground">{project.title}</h3>

        <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
          <span>{project.format}</span>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{countries.slice(0, 3).join(", ")}</span>
          </div>
          {/* 4.4 — application deadline, absent from the old brand browse card
              even though the public catalog has always shown it. Same urgent
              (<=45 days) highlight as catalog's ProjectRow. */}
          {project.applicationDeadline ? (
            <div className={cn("flex items-center gap-1.5", deadlineUrgent ? "text-warn" : undefined)}>
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                {untilLabel} {formatFullDate(project.applicationDeadline, intlLocale(locale))}
              </span>
            </div>
          ) : null}
        </div>

        {project.boxOfficeDisplay ? (
          <p className="mt-3 text-sm font-semibold text-foreground">{project.boxOfficeDisplay}</p>
        ) : null}

        <div className="mt-auto pt-5">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href={`/reports/${project.id}`}>{onRequestLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

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
  const t = makeUI(locale);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // 4.4 — parity with the public /catalog filter set (format, country,
  // language, production stage), plus a brand-only "open slots" toggle. Genre
  // is deliberately left out of this pass — the card already surfaces it via
  // the GenreBadge and the free-text search already matches on it.
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [slotsOnly, setSlotsOnly] = useState(false);

  // Format/Language show the full closed value set (same as catalog); Country
  // and Stage only show values actually present among the listed projects.
  const countryOptions = useMemo(
    () => Array.from(new Set(projects.flatMap((p) => splitCountries(p.countries)))).sort(),
    [projects],
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(projects.map((p) => p.status))).sort(),
    [projects],
  );

  const makeToggle =
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (value: string) =>
      setter((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  const toggleFormat = makeToggle(setSelectedFormats);
  const toggleLanguage = makeToggle(setSelectedLanguages);
  const toggleCountry = makeToggle(setSelectedCountries);
  const toggleStatus = makeToggle(setSelectedStatuses);

  const activeFilterCount =
    selectedFormats.length + selectedLanguages.length + selectedCountries.length + selectedStatuses.length + (slotsOnly ? 1 : 0);

  const hasFilters = activeFilterCount > 0;
  const clearAll = () => {
    setSelectedFormats([]);
    setSelectedLanguages([]);
    setSelectedCountries([]);
    setSelectedStatuses([]);
    setSlotsOnly(false);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (selectedFormats.length > 0 && !selectedFormats.includes(p.formatCategory)) return false;
      if (selectedLanguages.length > 0) {
        const langs = splitCountries(p.language);
        if (!selectedLanguages.some((s) => langs.includes(s))) return false;
      }
      if (selectedCountries.length > 0) {
        const cs = splitCountries(p.countries);
        if (!selectedCountries.some((s) => cs.includes(s))) return false;
      }
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(p.status)) return false;
      // "Open slots" = the same condition the catalog card's "X / Y placements
      // available" indicator already relies on (slotsTotal>0 means at least
      // one tier has a total set at all; slotsAvailable>0 means some of that
      // capacity is still unclaimed).
      if (slotsOnly && !(p.slotsTotal > 0 && p.slotsAvailable > 0)) return false;
      if (term && !`${p.title} ${p.genre} ${p.countries} ${p.synopsis}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [projects, search, selectedFormats, selectedLanguages, selectedCountries, selectedStatuses, slotsOnly]);

  const filterGroups = (
    <>
      <CheckboxFilter
        label={t("catalog.format")}
        options={FORMAT_CATEGORY_VALUES.map((v) => ({ value: v, label: localizeValue(locale, "formatCategory", v) }))}
        selected={selectedFormats}
        onToggle={toggleFormat}
      />
      <CheckboxFilter
        label={t("catalog.country")}
        options={countryOptions.map((c) => ({ value: c, label: c }))}
        selected={selectedCountries}
        onToggle={toggleCountry}
      />
      <CheckboxFilter
        label={t("catalog.language")}
        options={LANGUAGE_VALUES.map((v) => ({ value: v, label: localizeValue(locale, "language", v) }))}
        selected={selectedLanguages}
        onToggle={toggleLanguage}
      />
      <CheckboxFilter
        label={t("catalog.status")}
        options={statusOptions.map((s) => ({ value: s, label: t(`report.status.${s}`) }))}
        selected={selectedStatuses}
        onToggle={toggleStatus}
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
          {filtered.map((project) => (
            <BrowseCard
              key={project.id}
              project={project}
              favorited={favorites.has(project.id)}
              locale={locale}
              onRequestLabel={t("btn.viewReport")}
              favoriteAddAria={t("favorite.addAria")}
              favoriteRemoveAria={t("favorite.removeAria")}
              untilLabel={t("catalog.until")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
