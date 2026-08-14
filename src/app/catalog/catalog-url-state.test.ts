import { describe, it, expect } from "vitest";
import { filtersToQuery, filtersFromQuery, EMPTY_FILTERS } from "./catalog-url-state";

describe("catalog filters ↔ URL", () => {
  it("keeps an untouched catalogue at a bare /catalog", () => {
    expect(filtersToQuery(EMPTY_FILTERS)).toBe("");
  });

  it("round-trips a real selection", () => {
    const filters = {
      ...EMPTY_FILTERS,
      genres: ["Drama", "Comedy"],
      placementTypes: ["PRODUCT"],
      search: "aram",
      view: "list" as const,
      sortBy: "deadline" as const,
    };
    const parsed = filtersFromQuery(filtersToQuery(filters));
    expect(parsed).toMatchObject({
      genres: ["Drama", "Comedy"],
      placementTypes: ["PRODUCT"],
      search: "aram",
      view: "list",
      sortBy: "deadline",
    });
  });

  it("returns null for a query with nothing of ours, so sessionStorage still wins", () => {
    expect(filtersFromQuery("")).toBeNull();
    expect(filtersFromQuery("?utm_source=telegram")).toBeNull();
  });

  it("keeps the ?channel= arrival link from /ads working", () => {
    expect(filtersFromQuery("?channel=BILLBOARD")).toEqual({ channels: ["BILLBOARD"] });
  });

  it("ignores values outside the closed sets rather than trusting the URL", () => {
    expect(filtersFromQuery("?view=carousel&sort=price")).toBeNull();
  });

  it("drops empty items from a trailing comma", () => {
    expect(filtersFromQuery("?genre=Drama,,")).toEqual({ genres: ["Drama"] });
  });
});
