import { describe, it, expect } from "vitest";
import { FACETS, type FacetContext } from "./facets";
import type { CatalogRow } from "@/app/ads/ads-view";
import type { ProjectListDTO, AdSpaceListDTO } from "@/lib/types";

// Regression guards for the two non-obvious calls made building ATTR_FACETS/
// EVENT_FACETS out of AD_CHANNEL_ATTRS (stage 3, 2026-08-14) — a naive
// "first def wins" merge or a facet reading the wrong storage location are
// both bugs the type checker can't catch, only real filtering behaviour can.

const ctx: FacetContext = { locale: "en", t: (k) => k, localize: (_p, v) => v ?? "" };

function facet(key: string) {
  const f = FACETS.find((f) => f.key === key);
  if (!f) throw new Error(`no facet registered for "${key}"`);
  return f;
}

function spaceRow(overrides: Partial<AdSpaceListDTO>, channels: string[]): CatalogRow {
  const space = { attrs: {}, city: "", ...overrides } as AdSpaceListDTO;
  return { key: `space-${space.id}`, channels, title: space.title ?? "", haystack: "", kind: "AD_SPACE", space, channelSlug: "x" };
}

function projectRow(overrides: Partial<ProjectListDTO>, channels: string[]): CatalogRow {
  const project = { attrs: {}, eventCity: "", eventCategory: "", genres: [], genre: "", ...overrides } as ProjectListDTO;
  return { key: `project-${project.id}`, channels, title: project.title ?? "", haystack: "", kind: "PROJECT", project };
}

describe("ATTR_FACETS — generated from AD_CHANNEL_ATTRS", () => {
  it("unions a shared key's closed list across channels instead of keeping only the first one seen", () => {
    // RADIO's spotKind is SPOT/SEGMENT_SPONSORSHIP/HOST_READ, TV's is
    // SPOT/SHOW_SPONSORSHIP/TICKER — a merge that kept only RADIO's def would
    // silently drop TICKER off a TV row even though the row really has it.
    const radioRow = spaceRow({ id: 1, attrs: { spotKind: "HOST_READ" } }, ["RADIO"]);
    const tvRow = spaceRow({ id: 2, attrs: { spotKind: "TICKER" } }, ["TV"]);
    expect(facet("spotKind").options!([radioRow, tvRow], ctx).sort()).toEqual(["HOST_READ", "TICKER"]);
  });

  it("skips number attributes (no range control yet) rather than a checkbox per distinct number", () => {
    expect(FACETS.find((f) => f.key === "entrances")).toBeUndefined();
  });

  it("offers a boolean attribute as a single 'on' checkbox", () => {
    const lit = spaceRow({ id: 1, attrs: { lighting: true } }, ["BILLBOARD"]);
    const dark = spaceRow({ id: 2, attrs: {} }, ["BILLBOARD"]);
    expect(facet("lighting").options!([lit, dark], ctx)).toEqual(["true"]);
    expect(facet("lighting").matches(lit, ["true"])).toBe(true);
    expect(facet("lighting").matches(dark, ["true"])).toBe(false);
  });
});

describe("EVENT_FACETS — Project's first-class EVENTS columns", () => {
  it("eventCategory reads Project.eventCategory, not the attrs bag (it isn't stored there)", () => {
    const row = projectRow({ id: 1, eventCategory: "MUSIC" }, ["EVENTS"]);
    expect(facet("eventCategory").options!([row], ctx)).toEqual(["MUSIC"]);
    expect(facet("eventCategory").matches(row, ["MUSIC"])).toBe(true);
  });

  it("city merges an ad space's own city and an EVENTS project's eventCity into one facet", () => {
    const space = spaceRow({ id: 1, city: "Yerevan" }, ["BILLBOARD"]);
    const project = projectRow({ id: 2, eventCity: "Gyumri" }, ["EVENTS"]);
    expect(facet("city").options!([space, project], ctx).sort()).toEqual(["Gyumri", "Yerevan"]);
    expect(facet("city").matches(project, ["Gyumri"])).toBe(true);
    expect(facet("city").matches(space, ["Gyumri"])).toBe(false);
  });

  it("eventDate has no control yet — reserved in the registry, never matches", () => {
    const row = projectRow({ id: 1, eventDate: "2026-09-01" }, ["EVENTS"]);
    expect(facet("eventDate").matches(row, ["2026-09-01"])).toBe(false);
  });
});
