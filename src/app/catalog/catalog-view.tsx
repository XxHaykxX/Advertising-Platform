"use client";

import { useEffect, useMemo, useState } from "react";
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
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { AccentBadge, GenreBadge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/project-card";
import { ApplyDialog } from "@/components/apply-dialog";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { daysUntil, formatFullDate, splitCountries } from "@/lib/data/format";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, intlLocale, localizeValue, makeUI, UI, LOCALES, type Locale } from "@/lib/i18n";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currency";
import type { ProjectListDTO } from "@/lib/types";

type Gender = "All" | "Male" | "Female";
type SortKey = "relevant" | "views" | "budget";
type ViewMode = "grid" | "list";

// Budget filtering/sorting always compares the raw AMD bounds (budgetMinAmd/
// budgetMaxAmd), never the currency-converted budgetDisplay string — that
// keeps the min/max filter inputs meaningful regardless of which currency
// the visitor has selected for display.
function budgetBoundsAmd(p: ProjectListDTO): [number, number] {
  return [p.budgetMinAmd ?? 0, p.budgetMaxAmd ?? 0];
}

function parseViews(v: string): number {
  const match = v.match(/([\d.]+)\s*([MK]?)/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const suffix = match[2]?.toUpperCase();
  if (suffix === "M") return num * 1_000_000;
  if (suffix === "K") return num * 1_000;
  return num;
}

function ProjectRow({ project, locale = DEFAULT_LOCALE }: { project: ProjectListDTO; locale?: Locale }) {
  const t = makeUI(locale);
  const countries = splitCountries(project.countries);
  const slotsLeft = Math.max(project.slotsTotal - project.slotsTaken, 0);
  const deadlineDays = daysUntil(project.applicationDeadline);
  const deadlineUrgent = deadlineDays !== null && deadlineDays <= 45;
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 card-lift sm:flex-row sm:items-center">
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg sm:w-48">
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
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{project.title}</h3>
          <GenreBadge>{localizeValue(locale, "genre", project.genre)}</GenreBadge>
          {project.placementType ? (
            <AccentBadge>{localizeValue(locale, "placement", project.placementType)}</AccentBadge>
          ) : null}
        </div>
        <code className="text-xs text-muted-foreground">{project.code}</code>
        <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">{project.synopsis}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{project.format}</span>
          <span>{countries.slice(0, 3).join(", ")}</span>
          <span>{localizeValue(locale, "gender", project.audienceGender)}, {project.audienceAge}</span>
          <span className="text-primary">{project.opportunitiesCount} {t("card.opportunities")}</span>
          {project.budgetDisplay ? <span>{project.budgetDisplay}</span> : null}
          <span>{project.projViews} {t("card.projectedViews")}</span>
          {project.slotsTotal > 0 ? (
            <span>{slotsLeft} {t("card.slotsShort", { b: project.slotsTotal })}</span>
          ) : null}
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

      <div className="flex shrink-0 gap-3">
        <Button asChild variant="primary" size="sm">
          <Link href={`/reports/${project.id}`}>{t("btn.viewReport")}</Link>
        </Button>
        <ApplyDialog
          projectId={project.id}
          projectTitle={project.title}
          locale={locale}
          trigger={
            <Button variant="ghost" size="sm">
              {t("btn.requestDetails")}
            </Button>
          }
        />
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
}: {
  projects: ProjectListDTO[];
  locale?: Locale;
  currency?: CurrencyCode;
}) {
  const t = makeUI(locale);
  const genres = useMemo(
    () => Array.from(new Set(projects.map((p) => p.genre))).sort(),
    [projects],
  );
  const categories = useMemo(
    () => Array.from(new Set(projects.flatMap((p) => p.productCategories))).sort(),
    [projects],
  );
  const statuses = useMemo(
    () => Array.from(new Set(projects.map((p) => p.status))).sort(),
    [projects],
  );
  const statusOptions = useMemo(
    () => statuses.map((s) => ({ value: s, label: t(`report.status.${s}`) })),
    [statuses, t],
  );

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [gender, setGender] = useState<Gender>("All");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("relevant");
  const [view, setView] = useState<ViewMode>("grid");
  // Mobile filters live in a bottom-sheet (industry-standard on small screens —
  // a stacked sidebar buries the results below a long filter column). Desktop
  // keeps the always-visible sidebar.
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Count of active filter facets (excluding free-text search, which has its
  // own always-visible box) — shown as a badge on the mobile "Filters" button.
  const activeFilterCount =
    selectedGenres.length +
    selectedCategories.length +
    selectedStatuses.length +
    (gender !== "All" ? 1 : 0) +
    (budgetMin !== "" || budgetMax !== "" ? 1 : 0);

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
    selectedCategories.length > 0 ||
    selectedStatuses.length > 0 ||
    gender !== "All" ||
    budgetMin !== "" ||
    budgetMax !== "" ||
    search !== "";

  const clearAll = () => {
    setSelectedGenres([]);
    setSelectedCategories([]);
    setSelectedStatuses([]);
    setGender("All");
    setBudgetMin("");
    setBudgetMax("");
    setSearch("");
  };

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const toggleCategory = (c: string) => {
    setSelectedCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const toggleStatus = (s: string) => {
    setSelectedStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const min = budgetMin ? Number(budgetMin) : null;
    const max = budgetMax ? Number(budgetMax) : null;

    let list = projects.filter((p) => {
      if (selectedGenres.length > 0 && !selectedGenres.includes(p.genre)) return false;
      if (
        selectedCategories.length > 0 &&
        !p.productCategories.some((c) => selectedCategories.includes(c))
      )
        return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(p.status)) return false;
      if (gender !== "All" && p.audienceGender !== gender) return false;

      if (min !== null || max !== null) {
        const [pMin, pMax] = budgetBoundsAmd(p);
        if (min !== null && pMax < min) return false;
        if (max !== null && pMin > max) return false;
      }

      if (term) {
        const statusLabels = LOCALES.map(
          (l) => UI[`report.status.${p.status}`]?.[l] ?? "",
        ).join(" ");
        const haystack =
          `${p.title} ${p.genre} ${p.countries} ${p.synopsis} ${statusLabels}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });

    if (sort === "views") {
      list = [...list].sort((a, b) => parseViews(b.projViews) - parseViews(a.projViews));
    } else if (sort === "budget") {
      list = [...list].sort((a, b) => {
        const [, aMax] = budgetBoundsAmd(a);
        const [, bMax] = budgetBoundsAmd(b);
        return bMax - aMax;
      });
    }

    return list;
  }, [
    projects,
    selectedGenres,
    selectedCategories,
    selectedStatuses,
    gender,
    budgetMin,
    budgetMax,
    search,
    sort,
  ]);

  // Shared filter controls — rendered in the desktop sidebar AND the mobile
  // bottom-sheet, so the two never drift out of sync.
  const filterGroups = (
    <>
      <div className="border-t border-border py-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t("catalog.genre")}</h3>
        <div className="flex flex-col gap-2.5">
          {genres.map((g) => (
            <label key={g} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={selectedGenres.includes(g)}
                onChange={() => toggleGenre(g)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              {localizeValue(locale, "genre", g)}
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-border py-4">
        <h3 className="mb-1 text-sm font-semibold text-foreground">{t("catalog.targetAudience")}</h3>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("catalog.gender")}
        </p>
        <div className="inline-flex rounded-xl border border-border bg-muted p-1">
          {(["All", "Male", "Female"] as Gender[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                gender === g
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {g === "All" ? t("catalog.genderAll") : g === "Male" ? t("catalog.genderMale") : t("catalog.genderFemale")}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border py-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t("catalog.budgetRange")}</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder={t("catalog.min")}
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder={t("catalog.max")}
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
      </div>

      <CheckboxFilter
        label={t("catalog.productCategory")}
        options={categories.map((c) => ({ value: c, label: localizeValue(locale, "category", c) }))}
        selected={selectedCategories}
        onToggle={toggleCategory}
      />

      <CheckboxFilter
        label={t("catalog.status")}
        options={statusOptions}
        selected={selectedStatuses}
        onToggle={toggleStatus}
      />
    </>
  );

  return (
    <>
      <Header locale={locale} currency={currency} />

      <Container className="pt-6">
        <div className="mb-8 flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          {t("catalog.anonymizedNotice")}
        </div>
      </Container>

      <Container className="pb-20">
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

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="relevant">{t("catalog.sortMostRelevant")}</option>
                <option value="views">{t("catalog.sortViews")}</option>
                <option value="budget">{t("catalog.sortBudget")}</option>
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
              <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
              {filtered.length === 1 ? t("catalog.projectSingular") : t("catalog.projectPlural")}
            </p>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
                {t("catalog.noResults")}
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((project) => (
                  <ProjectCard key={project.id} project={project} locale={locale} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filtered.map((project) => (
                  <ProjectRow key={project.id} project={project} locale={locale} />
                ))}
              </div>
            )}
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
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">{filterGroups}</div>
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
                {t("catalog.showResults")} {filtered.length}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Footer locale={locale} currency={currency} />
    </>
  );
}
