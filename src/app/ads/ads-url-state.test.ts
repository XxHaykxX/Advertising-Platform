import { describe, it, expect } from "vitest";
import { filtersToQuery, filtersFromQuery, EMPTY_FILTERS } from "./ads-url-state";

describe("catalog filters ↔ URL", () => {
  it("keeps an untouched catalogue at a bare /ads", () => {
    expect(filtersToQuery(EMPTY_FILTERS)).toBe("");
  });

  it("round-trips a real selection", () => {
    const filters = {
      ...EMPTY_FILTERS,
      facets: { ...EMPTY_FILTERS.facets, genre: ["Drama", "Comedy"], ptype: ["PRODUCT"] },
      search: "aram",
      view: "list" as const,
      sortBy: "deadline" as const,
    };
    const parsed = filtersFromQuery(filtersToQuery(filters));
    expect(parsed).toMatchObject({
      facets: { genre: ["Drama", "Comedy"], ptype: ["PRODUCT"] },
      search: "aram",
      view: "list",
      sortBy: "deadline",
    });
  });

  it("round-trips every facet key at once", () => {
    const filters = {
      ...EMPTY_FILTERS,
      facets: {
        channel: ["BILLBOARD"],
        genre: ["Drama"],
        format: ["FEATURE"],
        platform: ["YouTube"],
        country: ["AM"],
        ptype: ["PRODUCT"],
        city: ["Yerevan"],
      },
    };
    const parsed = filtersFromQuery(filtersToQuery(filters));
    expect(parsed).toMatchObject({ facets: filters.facets });
  });

  it("returns null for a query with nothing of ours, so sessionStorage still wins", () => {
    expect(filtersFromQuery("")).toBeNull();
    expect(filtersFromQuery("?utm_source=telegram")).toBeNull();
  });

  it("keeps the ?channel= arrival link (including a redirected /catalog?channel= bookmark) working", () => {
    expect(filtersFromQuery("?channel=BILLBOARD")).toEqual({ facets: { channel: ["BILLBOARD"] } });
  });

  it("keeps an old ?genre=&city=&country= link working (facet is hidden, not gone)", () => {
    expect(filtersFromQuery("?genre=Drama&city=Yerevan&country=AM")).toEqual({
      facets: { genre: ["Drama"], city: ["Yerevan"], country: ["AM"] },
    });
  });

  it("ignores values outside the closed sets rather than trusting the URL", () => {
    expect(filtersFromQuery("?view=carousel&sort=price")).toBeNull();
  });

  it("drops empty items from a trailing comma", () => {
    expect(filtersFromQuery("?genre=Drama,,")).toEqual({ facets: { genre: ["Drama"] } });
  });
});
