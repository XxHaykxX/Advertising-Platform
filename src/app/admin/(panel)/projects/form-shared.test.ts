import { describe, it, expect } from "vitest";
import {
  deriveFormatCategory,
  kindForRole,
  publishBlockers,
  parseReferencesInput,
  FORMAT_CATEGORY_VALUES,
  ROLE_VALUES,
  type PublishCheckInput,
} from "./form-shared";

describe("deriveFormatCategory", () => {
  it("returns an explicit saved formatCategory verbatim (always wins)", () => {
    expect(deriveFormatCategory("PODCAST", "FILM", "Feature film")).toBe("PODCAST");
  });

  it("infers SERIES from a 'Series' format token (the catalog Format filter fix)", () => {
    expect(deriveFormatCategory("", "FILM", "Series · 18+")).toBe("SERIES");
  });

  it("infers FEATURE from Feature/Film/Movie/Documentary tokens", () => {
    expect(deriveFormatCategory("", "FILM", "Feature · 95 min")).toBe("FEATURE");
    expect(deriveFormatCategory("", "FILM", "Movie · 1h 40m")).toBe("FEATURE");
    expect(deriveFormatCategory("", "FILM", "Documentary · 44 min")).toBe("FEATURE");
  });

  it("infers the niche buckets from their tokens", () => {
    expect(deriveFormatCategory("", "FILM", "A sitcom pilot")).toBe("SITCOM");
    expect(deriveFormatCategory("", "FILM", "Weekly podcast")).toBe("PODCAST");
    expect(deriveFormatCategory("", "FILM", "Reality show")).toBe("REALITY");
    expect(deriveFormatCategory("", "FILM", "Short film")).toBe("SHORT");
    expect(deriveFormatCategory("", "FILM", "TV program")).toBe("PROGRAM");
  });

  it("matches Armenian and Russian tokens too", () => {
    expect(deriveFormatCategory("", "FILM", "սերիал")).toBe("SERIES");
    expect(deriveFormatCategory("", "FILM", "сериал")).toBe("SERIES");
    expect(deriveFormatCategory("", "FILM", "ситком")).toBe("SITCOM");
  });

  it("falls back to kind when the free-text hint carries no known token", () => {
    expect(deriveFormatCategory("", "SERIAL", "")).toBe("SERIES");
    expect(deriveFormatCategory("", "FILM", "")).toBe("FEATURE");
  });

  it("returns '' when nothing matches and kind is unknown", () => {
    expect(deriveFormatCategory("", "", "some noise")).toBe("");
  });

  it("only ever returns a valid bucket or empty string", () => {
    const valid = new Set<string>([...FORMAT_CATEGORY_VALUES, ""]);
    const samples = ["Series", "Feature", "Movie", "podcast", "reality", "short", "program", "", "junk"];
    for (const s of samples) {
      expect(valid.has(deriveFormatCategory("", "FILM", s))).toBe(true);
    }
  });
});

describe("kindForRole", () => {
  it("maps behind-the-camera roles to CREW", () => {
    expect(kindForRole("Director")).toBe("CREW");
    expect(kindForRole("Executive Producer")).toBe("CREW");
    expect(kindForRole("Writer")).toBe("CREW");
  });

  it("maps on-screen roles to CAST", () => {
    expect(kindForRole("Actor")).toBe("CAST");
    expect(kindForRole("Voice Actor")).toBe("CAST");
    expect(kindForRole("Show Host")).toBe("CAST");
  });

  it("falls back to CAST for blank / legacy free-text roles", () => {
    expect(kindForRole("")).toBe("CAST");
    expect(kindForRole("Ռեժիսոր")).toBe("CAST");
  });

  it("tolerates surrounding whitespace", () => {
    expect(kindForRole("  Producer  ")).toBe("CREW");
  });

  it("classifies every ROLE_VALUES entry as CAST or CREW", () => {
    for (const r of ROLE_VALUES) {
      expect(["CAST", "CREW"]).toContain(kindForRole(r));
    }
  });
});

// ── publishBlockers (owner decision 2026-07-26) ──────────────────────────
// A missing required field must block PUBLICATION, never the save — an
// incomplete project still has to be storable as a draft.

const COMPLETE: PublishCheckInput = {
  studio: "Sharm Holding",
  releaseDate: "2026-09-01",
  expectedReleaseDate: "",
  tagline: "One line that sells it",
  kind: "FILM",
  episodes: null,
  episodeMinutes: null,
  durationMinutes: 95,
  tiers: [{ name: "Official Sponsor", benefits: "Logo in credits" }],
};

describe("publishBlockers", () => {
  it("passes a fully filled project", () => {
    expect(publishBlockers(COMPLETE)).toEqual([]);
  });

  it("flags a missing studio", () => {
    expect(publishBlockers({ ...COMPLETE, studio: "  " })).toContain("publish.missing.studio");
  });

  it("accepts the expected release date in place of a real one", () => {
    expect(
      publishBlockers({ ...COMPLETE, releaseDate: "", expectedReleaseDate: "2027-01-01" }),
    ).toEqual([]);
    expect(publishBlockers({ ...COMPLETE, releaseDate: "", expectedReleaseDate: "" })).toContain(
      "publish.missing.releaseDate",
    );
  });

  it("requires a logline", () => {
    expect(publishBlockers({ ...COMPLETE, tagline: "" })).toContain("publish.missing.tagline");
  });

  it("requires a runtime for a Single and episode data for a Series", () => {
    expect(publishBlockers({ ...COMPLETE, durationMinutes: null })).toContain("publish.missing.duration");
    const series: PublishCheckInput = {
      ...COMPLETE,
      kind: "SERIAL",
      durationMinutes: null,
      episodes: 12,
      episodeMinutes: 45,
    };
    expect(publishBlockers(series)).toEqual([]);
    expect(publishBlockers({ ...series, episodeMinutes: null })).toContain("publish.missing.episodes");
  });

  it("requires at least one placement package, with a description", () => {
    expect(publishBlockers({ ...COMPLETE, tiers: [] })).toContain("publish.missing.tiers");
    // A blank-named row doesn't count as a package at all.
    expect(publishBlockers({ ...COMPLETE, tiers: [{ name: "  ", benefits: "x" }] })).toContain(
      "publish.missing.tiers",
    );
    expect(
      publishBlockers({ ...COMPLETE, tiers: [{ name: "Official Sponsor", benefits: "" }] }),
    ).toContain("publish.missing.tierBenefits");
  });

  it("reports every problem at once, not just the first", () => {
    const blockers = publishBlockers({
      ...COMPLETE,
      studio: "",
      tagline: "",
      tiers: [],
    });
    expect(blockers).toEqual(
      expect.arrayContaining(["publish.missing.studio", "publish.missing.tagline", "publish.missing.tiers"]),
    );
  });
});

// ── parseReferencesInput on the public side (audit 1.1) ──────────────────
// The storefront used to re-split this column on commas, which printed JSON
// fragments as chips and lost every link.

describe("parseReferencesInput", () => {
  it("parses the editor's JSON rows, keeping links", () => {
    const raw = JSON.stringify([
      { name: "Bohemian Rhapsody", url: "https://imdb.com/title/tt1727824" },
      { name: "Ray", url: "" },
    ]);
    expect(parseReferencesInput(raw)).toEqual([
      { name: "Bohemian Rhapsody", url: "https://imdb.com/title/tt1727824", media: "" },
      { name: "Ray", url: "", media: "" },
    ]);
  });

  it("still understands rows saved before the editor existed", () => {
    expect(parseReferencesInput("Ray, Bohemian Rhapsody")).toEqual([
      { name: "Ray", url: "" },
      { name: "Bohemian Rhapsody", url: "" },
    ]);
  });

  it("keeps an uploaded still/clip alongside the link", () => {
    const raw = JSON.stringify([
      { name: "Ray", url: "https://example.com", media: "/uploads/references/ray.jpg" },
    ]);
    expect(parseReferencesInput(raw)).toEqual([
      { name: "Ray", url: "https://example.com", media: "/uploads/references/ray.jpg" },
    ]);
  });

  it("never yields a JSON fragment as a title", () => {
    const raw = JSON.stringify([{ name: "Ray", url: "https://example.com/a,b" }]);
    for (const row of parseReferencesInput(raw)) {
      expect(row.name).not.toMatch(/[{}[\]"]/);
    }
  });

  it("returns nothing for empty input", () => {
    expect(parseReferencesInput("")).toEqual([]);
  });
});
