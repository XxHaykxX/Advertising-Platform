"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { AccentBadge, GenreBadge, SafetyBadge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/project-card";
import { ApplyDialog } from "@/components/apply-dialog";
import { Footer } from "@/components/footer";
import { daysUntil, formatFullDate, splitCountries } from "@/lib/data/format";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, intlLocale, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectListDTO } from "@/lib/types";

type Gender = "All" | "Male" | "Female";
type SortKey = "relevant" | "views" | "budget" | "safety";
type ViewMode = "grid" | "list";

function parseBudgetRange(range: string): [number, number] {
  const nums = range.match(/[\d,]+/g)?.map((s) => Number(s.replace(/,/g, ""))) ?? [];
  if (nums.length === 0) return [0, 0];
  if (nums.length === 1) return [nums[0], nums[0]];
  return [nums[0], nums[1]];
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
          <GenreBadge>{project.genre}</GenreBadge>
          <SafetyBadge safety={project.safety} />
          {project.placementType ? <AccentBadge>{project.placementType}</AccentBadge> : null}
        </div>
        <code className="text-xs text-muted-foreground">{project.code}</code>
        <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">{project.synopsis}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{project.format}</span>
          <span>{countries.slice(0, 3).join(", ")}</span>
          <span>{project.audienceGender}, {project.audienceAge}</span>
          <span className="text-primary">{project.opportunitiesCount} {t("card.opportunities")}</span>
          <span>{project.budgetRange}</span>
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

function StubFilter({ label, comingSoon }: { label: string; comingSoon: string }) {
  const [open, setOpen] = useState(false);
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
        <p className="mt-3 text-xs text-muted-foreground">{comingSoon}</p>
      ) : null}
    </div>
  );
}

export function CatalogView({
  projects,
  locale = DEFAULT_LOCALE,
}: {
  projects: ProjectListDTO[];
  locale?: Locale;
}) {
  const t = makeUI(locale);
  const genres = useMemo(
    () => Array.from(new Set(projects.map((p) => p.genre))).sort(),
    [projects],
  );

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [gender, setGender] = useState<Gender>("All");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [safeOnly, setSafeOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("relevant");
  const [view, setView] = useState<ViewMode>("grid");

  const hasFilters =
    selectedGenres.length > 0 ||
    gender !== "All" ||
    budgetMin !== "" ||
    budgetMax !== "" ||
    safeOnly ||
    search !== "";

  const clearAll = () => {
    setSelectedGenres([]);
    setGender("All");
    setBudgetMin("");
    setBudgetMax("");
    setSafeOnly(false);
    setSearch("");
  };

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const min = budgetMin ? Number(budgetMin) : null;
    const max = budgetMax ? Number(budgetMax) : null;

    let list = projects.filter((p) => {
      if (selectedGenres.length > 0 && !selectedGenres.includes(p.genre)) return false;
      if (gender !== "All" && p.audienceGender !== gender) return false;
      if (safeOnly && p.safetyScore < 80) return false;

      if (min !== null || max !== null) {
        const [pMin, pMax] = parseBudgetRange(p.budgetRange);
        if (min !== null && pMax < min) return false;
        if (max !== null && pMin > max) return false;
      }

      if (term) {
        const haystack = `${p.title} ${p.genre} ${p.countries} ${p.synopsis}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });

    if (sort === "views") {
      list = [...list].sort((a, b) => parseViews(b.projViews) - parseViews(a.projViews));
    } else if (sort === "budget") {
      list = [...list].sort((a, b) => {
        const [, aMax] = parseBudgetRange(a.budgetRange);
        const [, bMax] = parseBudgetRange(b.budgetRange);
        return bMax - aMax;
      });
    } else if (sort === "safety") {
      list = [...list].sort((a, b) => b.safetyScore - a.safetyScore);
    }

    return list;
  }, [projects, selectedGenres, gender, budgetMin, budgetMax, safeOnly, search, sort]);

  return (
    <>
      {/* Light sub-header */}
      <header className="border-b border-border bg-background">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-1 text-lg font-bold tracking-tight text-foreground">
            <span className="text-primary">FP</span> Placement
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 font-semibold text-foreground transition-colors hover:bg-muted"
            >
              {t("catalog.signIn")}
            </Link>
            <Button asChild variant="primary" size="sm">
              <Link href="/register?redirect=/catalog">{t("catalog.register")}</Link>
            </Button>
          </div>
        </Container>
      </header>

      <Container className="pt-6">
        <div className="mb-8 flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          {t("catalog.anonymizedNotice")}
        </div>
      </Container>

      <Container className="pb-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar filters */}
          <aside>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t("catalog.filters")}
            </h2>

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
                    {g}
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

            <StubFilter label={t("catalog.productCategory")} comingSoon={t("catalog.comingSoon")} />

            <div className="border-t border-border py-4">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{t("catalog.brandSafety")}</h3>
              </div>
              <label className="mt-2 flex items-center gap-2.5 text-sm text-foreground">
                <button
                  type="button"
                  role="switch"
                  aria-checked={safeOnly}
                  onClick={() => setSafeOnly((v) => !v)}
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    safeOnly ? "bg-primary" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                      safeOnly ? "translate-x-4 left-0.5" : "left-0.5",
                    )}
                  />
                </button>
                {t("catalog.safeOnly")} <span className="text-muted-foreground">(80+)</span>
              </label>
            </div>

            <StubFilter label={t("catalog.status")} comingSoon={t("catalog.comingSoon")} />

            <div className="pt-4">
              <button
                type="button"
                onClick={clearAll}
                disabled={!hasFilters}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("catalog.clearAll")}
              </button>
            </div>
          </aside>

          {/* Main content */}
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
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
                <option value="safety">{t("catalog.sortSafety")}</option>
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

      <Footer locale={locale} />
    </>
  );
}
