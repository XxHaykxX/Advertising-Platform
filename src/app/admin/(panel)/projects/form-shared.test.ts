import { describe, it, expect } from "vitest";
import {
  deriveFormatCategory,
  kindForRole,
  publishBlockers,
  parseReferencesInput,
  mergeTierTemplates,
  groupDigits,
  withExclusive,
  withTotalSlots,
  validateReleaseDateValue,
  FORMAT_CATEGORY_VALUES,
  ROLE_VALUES,
  PLACEMENTS_REQUIRED_FROM,
  type PublishCheckInput,
  firstFilledLocale,
  safeUploadPath,
} from "./form-shared";

describe("deriveFormatCategory", () => {
  it("returns an explicit saved formatCategory verbatim (always wins)", () => {
    expect(deriveFormatCategory("PODCAST", "FILM", "Feature film")).toBe("PODCAST");
  });

  it("infers SERIES from a 'Series' format token (the catalog Format filter fix)", () => {
    expect(deriveFormatCategory("", "FILM", "Series · 18+")).toBe("SERIES");
  });

  it("infers FEATURE from Feature/Film/Movie tokens", () => {
    expect(deriveFormatCategory("", "FILM", "Feature · 95 min")).toBe("FEATURE");
    expect(deriveFormatCategory("", "FILM", "Movie · 1h 40m")).toBe("FEATURE");
  });

  // Both are buckets of their own in FORMAT_CATEGORY_VALUES *and* genres in
  // GENRES, so real rows carry the word. Until 2026-08-05 "documentary" was
  // swallowed by the feature branch and came back FEATURE (this test asserted
  // that), while "animation" matched nothing and fell through to the `kind`
  // fallback — a cartoon series was filed as a plain feature film.
  it("infers DOCUMENTARY and ANIMATION rather than lumping them into FEATURE", () => {
    expect(deriveFormatCategory("", "FILM", "Documentary · 44 min")).toBe("DOCUMENTARY");
    expect(deriveFormatCategory("", "FILM", "Документальный фильм")).toBe("DOCUMENTARY");
    expect(deriveFormatCategory("", "SERIAL", "Animation")).toBe("ANIMATION");
    expect(deriveFormatCategory("", "FILM", "Анимация · 12 серий")).toBe("ANIMATION");
  });

  it("still lets an explicitly saved value win over any guess", () => {
    expect(deriveFormatCategory("MINISERIES", "FILM", "Documentary · 44 min")).toBe("MINISERIES");
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
  tagline: "One line that sells it",
  kind: "FILM",
  episodes: null,
  episodeMinutes: null,
  durationMinutes: 95,
  tiers: [{ name: "Official Sponsor", benefits: "Logo in credits" }],
  poster: "/uploads/projects/poster.jpg",
  placementsCount: 1,
  formatCategory: "FEATURE",
  applicationDeadline: "2026-09-01",
  applicationDeadlineOngoing: false,
  // Created after the cutoff — the placements requirement applies (most of
  // the grandfather-clause tests below flip this to check the exemption).
  createdAt: new Date(PLACEMENTS_REQUIRED_FROM.getTime() + 24 * 60 * 60 * 1000),
};

describe("publishBlockers", () => {
  it("passes a fully filled project", () => {
    expect(publishBlockers(COMPLETE)).toEqual([]);
  });

  it("flags a missing studio", () => {
    expect(publishBlockers({ ...COMPLETE, studio: "  " })).toContain("publish.missing.studio");
  });

  // IA-42 (2026-08-01): release date must be fully optional — it used to be a
  // hard publish requirement, but it now also supports an imprecise
  // (year/month-only) value, so it can no longer block publication.
  it("no longer requires a release date", () => {
    expect(publishBlockers(COMPLETE)).not.toContain("publish.missing.releaseDate");
    // PublishCheckInput doesn't even carry a releaseDate field any more —
    // COMPLETE above passes with none, confirming the check is fully gone,
    // not just satisfied by coincidence.
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

  // ── Four requirements added 2026-08-04 ────────────────────────────────────
  it("requires a poster", () => {
    expect(publishBlockers({ ...COMPLETE, poster: "" })).toContain("publish.missing.poster");
    expect(publishBlockers({ ...COMPLETE, poster: null })).toContain("publish.missing.poster");
  });

  it("requires at least one placement — a storefront must have a product", () => {
    expect(publishBlockers({ ...COMPLETE, placementsCount: 0 })).toContain("publish.missing.placements");
  });

  // ── Placements grandfather clause (owner decision 2026-08-04) ────────────
  // Prod already carries 8 published projects built entirely on sponsorship
  // tiers with zero placements — the owner's call was to exempt exactly those
  // (anything that existed before the requirement shipped), not to refuse them
  // at their next re-approval. Poster/formatCategory/deadline get no such
  // exemption.
  describe("placements grandfather clause", () => {
    it("exempts a project created before the cutoff, even with zero placements", () => {
      const grandfathered: PublishCheckInput = {
        ...COMPLETE,
        placementsCount: 0,
        createdAt: new Date(PLACEMENTS_REQUIRED_FROM.getTime() - 24 * 60 * 60 * 1000),
      };
      expect(publishBlockers(grandfathered)).not.toContain("publish.missing.placements");
    });

    it("requires it for a project created exactly at or after the cutoff", () => {
      const atCutoff: PublishCheckInput = {
        ...COMPLETE,
        placementsCount: 0,
        createdAt: new Date(PLACEMENTS_REQUIRED_FROM),
      };
      expect(publishBlockers(atCutoff)).toContain("publish.missing.placements");
    });

    it("requires it for a brand-new project (createdAt null — nothing to grandfather yet)", () => {
      const brandNew: PublishCheckInput = { ...COMPLETE, placementsCount: 0, createdAt: null };
      expect(publishBlockers(brandNew)).toContain("publish.missing.placements");
    });

    it("does not exempt poster/formatCategory/deadline for an old project", () => {
      const old = new Date(PLACEMENTS_REQUIRED_FROM.getTime() - 24 * 60 * 60 * 1000);
      const blockers = publishBlockers({
        ...COMPLETE,
        createdAt: old,
        poster: "",
        formatCategory: "",
        applicationDeadline: null,
        applicationDeadlineOngoing: false,
      });
      expect(blockers).toEqual(
        expect.arrayContaining([
          "publish.missing.poster",
          "publish.missing.formatCategory",
          "publish.missing.deadline",
        ]),
      );
    });
  });

  it("requires a formatCategory — an empty one drops the project from the catalog's Format filter", () => {
    expect(publishBlockers({ ...COMPLETE, formatCategory: "" })).toContain("publish.missing.formatCategory");
    expect(publishBlockers({ ...COMPLETE, formatCategory: null })).toContain("publish.missing.formatCategory");
  });

  it("requires an explicit deadline decision — a date OR the Ongoing flag", () => {
    expect(
      publishBlockers({ ...COMPLETE, applicationDeadline: null, applicationDeadlineOngoing: false }),
    ).toContain("publish.missing.deadline");
    // Either half of the pair satisfies it.
    expect(
      publishBlockers({ ...COMPLETE, applicationDeadline: null, applicationDeadlineOngoing: true }),
    ).not.toContain("publish.missing.deadline");
    expect(
      publishBlockers({ ...COMPLETE, applicationDeadline: "2026-09-01", applicationDeadlineOngoing: false }),
    ).not.toContain("publish.missing.deadline");
  });
});

// ── validateReleaseDateValue (review finding, 2026-08-02) ─────────────────
// A <input type="month"> that degrades to free text (desktop Firefox/Safari
// don't implement it), or a crafted request, must not reach dateOrNull —
// each precision only accepts the exact ISO date-only shape it submits.
describe("validateReleaseDateValue", () => {
  it("passes an empty value at every precision — release date is optional", () => {
    expect(validateReleaseDateValue("", "DAY")).toBeNull();
    expect(validateReleaseDateValue("", "MONTH")).toBeNull();
    expect(validateReleaseDateValue("", "YEAR")).toBeNull();
  });

  it("accepts the exact shape each precision submits", () => {
    expect(validateReleaseDateValue("2027-07-15", "DAY")).toBeNull();
    expect(validateReleaseDateValue("2027-07", "MONTH")).toBeNull();
    expect(validateReleaseDateValue("2027", "YEAR")).toBeNull();
  });

  it("flags a value that doesn't match its claimed precision's shape", () => {
    // The concrete trigger: a <input type="month"> degraded to a plain text
    // box and the editor typed a human date instead of "YYYY-MM".
    expect(validateReleaseDateValue("Май 2027", "MONTH")).toBe("shape");
    // A full date where only a month was claimed, and vice versa.
    expect(validateReleaseDateValue("2027-07-15", "MONTH")).toBe("shape");
    expect(validateReleaseDateValue("2027-07", "DAY")).toBe("shape");
    expect(validateReleaseDateValue("2027-07-15", "YEAR")).toBe("shape");
  });

  it("flags a syntactically fine year outside the sane 1900–2100 window", () => {
    expect(validateReleaseDateValue("20277", "YEAR")).toBe("shape"); // 5 digits — also fails the shape check
    expect(validateReleaseDateValue("1899", "YEAR")).toBe("range");
    expect(validateReleaseDateValue("2101", "YEAR")).toBe("range");
    expect(validateReleaseDateValue("1900", "YEAR")).toBeNull();
    expect(validateReleaseDateValue("2100", "YEAR")).toBeNull();
  });

  it("range-checks the year embedded in a MONTH or DAY value too", () => {
    expect(validateReleaseDateValue("1899-07", "MONTH")).toBe("range");
    expect(validateReleaseDateValue("1899-07-15", "DAY")).toBe("range");
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

describe("groupDigits", () => {
  it("groups an AMD price into thousands with a non-breaking space", () => {
    expect(groupDigits("1500000")).toBe("1 500 000");
  });

  it("leaves short numbers and an empty string alone", () => {
    expect(groupDigits("750")).toBe("750");
    expect(groupDigits("")).toBe("");
  });
});

describe("withTotalSlots", () => {
  const fresh = { isExclusive: false, availableSlots: null, totalSlots: null };

  it("fills Available from Total on a fresh tier", () => {
    expect(withTotalSlots(fresh, 5)).toMatchObject({ totalSlots: 5, availableSlots: 5 });
  });

  it("keeps Available following Total while the two match", () => {
    const row = { isExclusive: false, availableSlots: 5, totalSlots: 5 };
    expect(withTotalSlots(row, 8)).toMatchObject({ totalSlots: 8, availableSlots: 8 });
  });

  it("leaves a diverged Available alone (slots are already sold)", () => {
    const row = { isExclusive: false, availableSlots: 2, totalSlots: 5 };
    expect(withTotalSlots(row, 6)).toMatchObject({ totalSlots: 6, availableSlots: 2 });
  });
});

describe("withExclusive", () => {
  it("pins Total to one slot", () => {
    const row = { isExclusive: false, availableSlots: 5, totalSlots: 5 };
    expect(withExclusive(row, true)).toMatchObject({
      isExclusive: true,
      totalSlots: 1,
      availableSlots: 1,
    });
  });

  it("never puts a sold-out slot back on sale", () => {
    const row = { isExclusive: false, availableSlots: 0, totalSlots: 3 };
    expect(withExclusive(row, true).availableSlots).toBe(0);
  });

  it("only clears the flag when unchecked, leaving the numbers", () => {
    const row = { isExclusive: true, availableSlots: 1, totalSlots: 1 };
    expect(withExclusive(row, false)).toEqual({
      isExclusive: false,
      availableSlots: 1,
      totalSlots: 1,
    });
  });
});

describe("mergeTierTemplates", () => {
  const json = (...lines: string[]) => JSON.stringify(lines);

  it("offers one template per name, most used first", () => {
    const merged = mergeTierTemplates([
      { name: "Official Sponsor", benefits: json("Logo in credits") },
      { name: "Product placement", benefits: json("In-scene product") },
      { name: "Official Sponsor", benefits: json("Logo in credits") },
    ]);
    expect(merged.map((t) => [t.name, t.uses])).toEqual([
      ["Official Sponsor", 2],
      ["Product placement", 1],
    ]);
  });

  it("treats a different casing as the same placement", () => {
    const merged = mergeTierTemplates([
      { name: "Official Sponsor", benefits: json("Logo") },
      { name: "  official sponsor ", benefits: json("Logo") },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].uses).toBe(2);
  });

  it("keeps the fuller benefits list of the variants", () => {
    const merged = mergeTierTemplates([
      { name: "Title Sponsor", benefits: json("Logo") },
      { name: "Title Sponsor", benefits: json("Logo", "Premiere invitations", "Credits") },
    ]);
    expect(merged[0].benefits).toBe("Logo\nPremiere invitations\nCredits");
  });

  it("skips blank names and survives unparsable benefits", () => {
    const merged = mergeTierTemplates([
      { name: "   ", benefits: json("x") },
      { name: "Partner", benefits: "not json" },
      { name: "Partner", benefits: null },
    ]);
    expect(merged).toEqual([{ name: "Partner", benefits: "", uses: 2 }]);
  });

  it("caps the menu at the requested length", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ name: `Tier ${i}`, benefits: json("x") }));
    expect(mergeTierTemplates(rows, 5)).toHaveLength(5);
  });
});

describe("firstFilledLocale", () => {
  it("prefers the site's default locale, then whatever else was filled", () => {
    expect(firstFilledLocale({ hy: "Հ", ru: "Р", en: "E" })).toBe("Հ");
    expect(firstFilledLocale({ hy: "  ", ru: "Р", en: "E" })).toBe("Р");
    expect(firstFilledLocale({ hy: "", ru: "", en: "E" })).toBe("E");
  });

  it("returns an empty string only when every tab is empty", () => {
    // This is exactly the case publishBlockers is meant to catch, so it must
    // stay distinguishable — the legacy column going blank is the signal.
    expect(firstFilledLocale({ hy: " ", ru: "", en: undefined })).toBe("");
  });
});

describe("safeUploadPath", () => {
  it("keeps a path inside the uploads root", () => {
    expect(safeUploadPath("/uploads/presentations/1-2.pdf")).toBe("/uploads/presentations/1-2.pdf");
    expect(safeUploadPath("  /uploads/presentations/1-2.pdf  ")).toBe(
      "/uploads/presentations/1-2.pdf",
    );
  });

  it("refuses anything that isn't one", () => {
    // The project page renders this as a link a brand clicks, so an off-site
    // URL or a traversal would be a download button pointing anywhere.
    expect(safeUploadPath("https://evil.example/x.pdf")).toBe("");
    expect(safeUploadPath("/uploads/../../etc/passwd")).toBe("");
    expect(safeUploadPath("/uploads\\windows\\x.pdf")).toBe("");
    expect(safeUploadPath("uploads/x.pdf")).toBe("");
  });

  it("passes an empty value through — that is how a file is detached", () => {
    expect(safeUploadPath("")).toBe("");
    expect(safeUploadPath("   ")).toBe("");
  });
});
