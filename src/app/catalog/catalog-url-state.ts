/* The catalogue's filter state as a URL query string.
 *
 * Filters used to live only in sessionStorage (IA-24, so Back from a project
 * restores them). That solves coming back; it does not solve sending. A brand
 * who narrowed the catalogue to "animation, product placement, Yerevan" had no
 * way to hand that view to a colleague — the address bar said "/catalog" the
 * whole time, and Back never undid a filter either (QA pass, 2026-08-14).
 *
 * Kept as plain functions so both directions are testable without a DOM.
 */

export type CatalogFilters = {
  channels: string[];
  genres: string[];
  formats: string[];
  platforms: string[];
  countries: string[];
  placementTypes: string[];
  cities: string[];
  search: string;
  view: "grid" | "list";
  sortBy: "default" | "newest" | "deadline" | "title";
};

export const EMPTY_FILTERS: CatalogFilters = {
  channels: [],
  genres: [],
  formats: [],
  platforms: [],
  countries: [],
  placementTypes: [],
  cities: [],
  search: "",
  view: "grid",
  sortBy: "default",
};

/** Query-string name per list facet. `channel` keeps the name the arrival link
 *  from /ads already uses, so an existing bookmark keeps working. */
const LIST_PARAMS: Record<string, keyof CatalogFilters> = {
  channel: "channels",
  genre: "genres",
  format: "formats",
  platform: "platforms",
  country: "countries",
  ptype: "placementTypes",
  city: "cities",
};

const VIEWS = ["grid", "list"] as const;
const SORTS = ["default", "newest", "deadline", "title"] as const;

/** Filters → "?genre=Drama,Comedy&q=aram". Defaults are omitted, so an
 *  untouched catalogue keeps a clean "/catalog" in the address bar. */
export function filtersToQuery(f: CatalogFilters): string {
  const params = new URLSearchParams();
  for (const [param, key] of Object.entries(LIST_PARAMS)) {
    const values = f[key] as string[];
    if (values.length > 0) params.set(param, values.join(","));
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
  const out: Partial<CatalogFilters> = {};

  for (const [param, key] of Object.entries(LIST_PARAMS)) {
    const raw = params.get(param);
    if (raw === null) continue;
    const values = raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length > 0) (out[key] as string[]) = values;
  }

  const q = params.get("q");
  if (q) out.search = q;

  const view = params.get("view");
  if (view && (VIEWS as readonly string[]).includes(view)) out.view = view as CatalogFilters["view"];

  const sort = params.get("sort");
  if (sort && (SORTS as readonly string[]).includes(sort)) out.sortBy = sort as CatalogFilters["sortBy"];

  return Object.keys(out).length > 0 ? out : null;
}
