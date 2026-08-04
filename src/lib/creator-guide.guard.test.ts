import { describe, it, expect } from "vitest";
import { GUIDE_STEPS, REQUIRED_FIELD_IDS, GUIDE_TIERS, type GuideField } from "./creator-guide";
import { UI, LOCALES } from "./i18n";
// BLOCKS_PUBLISH / projectCompleteness are imported HERE ONLY — creator-guide.ts
// (the manifest) deliberately does not import BLOCKS_PUBLISH, since that set is
// owned by a change landing in parallel. This test is what keeps the two from
// silently drifting apart.
import { projectCompleteness, type CompletenessKey } from "./project-completeness";

const ALL_FIELDS: GuideField[] = GUIDE_STEPS.flatMap((step) => step.fields);

// Every CompletenessKey the real module produces, read at runtime off a
// minimal-but-complete input rather than hand-copied — so a brand-new key
// added to project-completeness.ts shows up here (and fails loudly below)
// without this test needing to be told about it by hand.
const ALL_COMPLETENESS_KEYS: CompletenessKey[] = projectCompleteness({
  tagline: "",
  studio: null,
  kind: "FILM",
  episodes: null,
  episodeMinutes: null,
  durationMinutes: null,
  poster: null,
  videoEmbedUrl: null,
  videoFile: null,
  gallery: null,
  castCount: 0,
  milestonesCount: 0,
  placementsCount: 0,
  tiers: [],
  references: null,
  applicationDeadline: null,
  applicationDeadlineOngoing: false,
  releaseDate: null,
  platforms: null,
  cinemas: null,
  productionBudgetAmd: null,
  ageRating: null,
  formatCategory: null,
}).map((item) => item.key);

// CompletenessKeys with no field of their own on this page, and why:
//  - translations: an aggregate over title/synopsis/logline across all THREE
//    locales, not a single field — those three fields are already covered
//    individually by the step-1 rows, which explain that one language is
//    enough to start.
//  - placementPricing: an advisory sub-metric of the placements row (whether
//    any placement carries a price) — already covered by that row's own
//    description ("price in AMD, or empty = on request").
// `milestones` used to sit here too, back when the Production Timeline was
// admin-only. It was opened to creators on 2026-08-04 and now has a row of its
// own in step 4, so the exemption is gone — if that row is ever removed while
// the section stays open to creators, the first test below fails.
const EXEMPT_COMPLETENESS_KEYS: readonly CompletenessKey[] = ["translations", "placementPricing"];

describe("creator-guide manifest — stays in sync with project-completeness.ts", () => {
  it("every CompletenessKey is either on the page or explicitly exempted", () => {
    const covered = new Set(ALL_FIELDS.map((f) => f.completenessKey).filter(Boolean));
    const missing = ALL_COMPLETENESS_KEYS.filter(
      (key) => !covered.has(key) && !EXEMPT_COMPLETENESS_KEYS.includes(key),
    );
    expect(missing, `CompletenessKey(s) missing from the guide and not exempted: ${missing.join(", ")}`).toEqual([]);
  });

  it("every field tagged tier \"publish\" mirrors a BLOCKS_PUBLISH key, and vice versa", () => {
    // BLOCKS_PUBLISH itself isn't exported — read it back off blocksPublish
    // instead, same runtime-derived approach as ALL_COMPLETENESS_KEYS above.
    const blocksPublish = new Set(
      projectCompleteness({
        tagline: "",
        studio: null,
        kind: "FILM",
        episodes: null,
        episodeMinutes: null,
        durationMinutes: null,
        poster: null,
        videoEmbedUrl: null,
        videoFile: null,
        gallery: null,
        castCount: 0,
        milestonesCount: 0,
        placementsCount: 0,
        tiers: [],
        references: null,
        applicationDeadline: null,
        applicationDeadlineOngoing: false,
        releaseDate: null,
        platforms: null,
        cinemas: null,
        productionBudgetAmd: null,
        ageRating: null,
        formatCategory: null,
      })
        .filter((item) => item.blocksPublish)
        .map((item) => item.key),
    );

    const publishFields = ALL_FIELDS.filter((f) => f.tier === "publish");

    const wronglyTaggedPublish = publishFields
      .filter((f) => !f.completenessKey || !blocksPublish.has(f.completenessKey))
      .map((f) => f.id);
    expect(wronglyTaggedPublish, `tier "publish" but not in BLOCKS_PUBLISH: ${wronglyTaggedPublish.join(", ")}`).toEqual([]);

    const publishKeysOnPage = new Set(publishFields.map((f) => f.completenessKey));
    const notTaggedPublish = [...blocksPublish].filter((key) => !publishKeysOnPage.has(key));
    expect(
      notTaggedPublish,
      `in BLOCKS_PUBLISH but not tagged tier "publish" on the page: ${notTaggedPublish.join(", ")}`,
    ).toEqual([]);
  });
});

describe("creator-guide manifest — stays in sync with actions.ts validate()", () => {
  it("REQUIRED_FIELD_IDS matches the fields tagged tier \"required\"", () => {
    const requiredOnPage = ALL_FIELDS.filter((f) => f.tier === "required").map((f) => f.id).sort();
    expect(requiredOnPage).toEqual([...REQUIRED_FIELD_IDS].sort());
  });
});

describe("creator-guide manifest — every referenced i18n key exists", () => {
  it("labelKey / descKey / exampleKey resolve to a non-empty string in all three locales", () => {
    const keys = new Set<string>();
    for (const field of ALL_FIELDS) {
      keys.add(field.labelKey);
      keys.add(field.descKey);
      if (field.exampleKey) keys.add(field.exampleKey);
    }
    for (const tier of Object.values(GUIDE_TIERS)) {
      keys.add(tier.labelKey);
      keys.add(tier.descKey);
    }

    const missing: string[] = [];
    for (const key of keys) {
      const dict = UI[key] as Record<string, string> | undefined;
      for (const loc of LOCALES) {
        if (!dict || typeof dict[loc] !== "string" || dict[loc].trim() === "") missing.push(`${key}.${loc}`);
      }
    }
    expect(missing, `missing/empty i18n key(s):\n${missing.join("\n")}`).toEqual([]);
  });
});
