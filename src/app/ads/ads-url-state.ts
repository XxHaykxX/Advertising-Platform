/* The catalogue's filter state as a URL query string.
 *
 * Filters used to live only in sessionStorage (IA-24, so Back from a project
 * restores them). That solves coming back; it does not solve sending. A brand
 * who narrowed the catalogue to "animation, product placement, Yerevan" had no
 * way to hand that view to a colleague — the address bar said "/catalog" the
 * whole time, and Back never undid a filter either (QA pass, 2026-08-14).
 *
 * Moved from /catalog into /ads (2026-08-14, stage 1 of the ads/catalog
 * merge) — the module itself didn't change, only where it lives. Generalized
 * from a fixed seven-field CatalogFilters to a facet-keyed record (stage 2)
 * — FACET_KEYS (facets.ts) is the one list of query param names now, so a
 * facet added there needs no matching edit here.
 *
 * Kept as plain functions so both directions are testable without a DOM.
 */

import { FACET_KEYS } from "@/lib/catalog/facets";

export type CatalogFilters = {
  /** One entry per facet key (facets.ts) — e.g. facets.genre, facets.ptype. */
  facets: Record<string, string[]>;
  search: string;
  view: "grid" | "list";
  sortBy: "default" | "newest" | "deadline" | "title";
};

export const EMPTY_FILTERS: CatalogFilters = {
  facets: Object.fromEntries(FACET_KEYS.map((key) => [key, []])),
  search: "",
  view: "grid",
  sortBy: "default",
};

const VIEWS = ["grid", "list"] as const;
const SORTS = ["default", "newest", "deadline", "title"] as const;

/** Filters → "?genre=Drama,Comedy&q=aram". Defaults are omitted, so an
 *  untouched catalogue keeps a clean "/ads" in the address bar. */
export function filtersToQuery(f: CatalogFilters): string {
  const params = new URLSearchParams();
  for (const key of FACET_KEYS) {
    const values = f.facets[key];
    if (values && values.length > 0) params.set(key, values.join(","));
  }
  if (f.search.trim()) params.set("q", f.search.trim());
  if (f.view !== "grid") params.set("view", f.view);
  if (f.sortBy !== "default") params.set("sort", f.sortBy);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** "?genre=Drama&view=list" → a partial filter set. Returns null when the
 *  query carries nothing we recognise, which is how the caller knows to fall
 *  back to sessionStorage instead of overwriting it with defaults. */
export function filtersFromQuery(search: string): Partial<CatalogFilters> | null {
  const params = new URLSearchParams(search);
  const facets: Record<string, string[]> = {};

  for (const key of FACET_KEYS) {
    const raw = params.get(key);
    if (raw === null) continue;
    const values = raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length > 0) facets[key] = values;
  }

  const out: Partial<CatalogFilters> = {};
  if (Object.keys(facets).length > 0) out.facets = facets;

  const q = params.get("q");
  if (q) out.search = q;

  const view = params.get("view");
  if (view && (VIEWS as readonly string[]).includes(view)) out.view = view as CatalogFilters["view"];

  const sort = params.get("sort");
  if (sort && (SORTS as readonly string[]).includes(sort)) out.sortBy = sort as CatalogFilters["sortBy"];

  return Object.keys(out).length > 0 ? out : null;
}
