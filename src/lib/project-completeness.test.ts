import { describe, it, expect } from "vitest";
import { projectCompleteness, missingCount, type CompletenessInput } from "./project-completeness";
import { PLACEMENTS_REQUIRED_FROM } from "@/app/admin/(panel)/projects/form-shared";

const FULL: CompletenessInput = {
  tagline: "One line that sells it",
  poster: "/uploads/projects/poster.jpg",
  videoEmbedUrl: "https://youtube.com/watch?v=abc",
  videoFile: null,
  gallery: JSON.stringify(["/uploads/projects/1.jpg"]),
  castCount: 3,
  milestonesCount: 2,
  placementsCount: 1,
  tiers: [{ benefits: "Logo in credits" }],
  studio: "Sharm Animation",
  kind: "SERIAL",
  episodes: 12,
  episodeMinutes: 11,
  durationMinutes: null,
  references: JSON.stringify([{ name: "Ray", url: "https://example.com", media: "" }]),
  applicationDeadline: "2026-09-01",
  applicationDeadlineOngoing: false,
  releaseDate: "2026-10-01",
  platforms: JSON.stringify(["YouTube"]),
  cinemas: "Cinema Star",
  productionBudgetAmd: 5_000_000,
  ageRating: "12+",
  formatCategory: "SERIES",
  countries: "Armenia",
  castPhotoCount: 3,
  titleHy: "Վերնագիր",
  titleRu: "Название",
  titleEn: "Title",
  synopsisHy: "Համառոտագիր",
  synopsisRu: "Синопсис",
  synopsisEn: "Synopsis",
  taglineHy: "Կարգախոս",
  taglineRu: "Слоган",
  taglineEn: "Tagline",
  placementPricing: [{ priceAmd: 500_000 }],
};

const EMPTY: CompletenessInput = {
  tagline: "",
  poster: null,
  videoEmbedUrl: null,
  videoFile: null,
  gallery: null,
  castCount: 0,
  milestonesCount: 0,
  placementsCount: 0,
  tiers: [],
  studio: null,
  kind: "SERIAL",
  episodes: null,
  episodeMinutes: null,
  durationMinutes: null,
  references: null,
  applicationDeadline: null,
  applicationDeadlineOngoing: false,
  releaseDate: null,
  platforms: null,
  cinemas: null,
  productionBudgetAmd: null,
  ageRating: null,
  formatCategory: null,
  countries: null,
  castPhotoCount: 0,
  titleHy: null,
  titleRu: null,
  titleEn: null,
  synopsisHy: null,
  synopsisRu: null,
  synopsisEn: null,
  taglineHy: null,
  taglineRu: null,
  taglineEn: null,
  placementPricing: [],
};

describe("projectCompleteness", () => {
  it("marks every item filled for a fully-filled project", () => {
    const items = projectCompleteness(FULL);
    expect(items).toHaveLength(22);
    expect(missingCount(items)).toBe(0);
    expect(items.every((i) => i.filled)).toBe(true);
  });

  it("marks every item empty for a blank project", () => {
    const items = projectCompleteness(EMPTY);
    expect(missingCount(items)).toBe(22);
    expect(items.every((i) => !i.filled)).toBe(true);
  });

  // ── Four advisory items added 2026-08-04 (part b) ─────────────────────────
  it("requires ALL THREE locales for translations, not just one", () => {
    const hyOnly = projectCompleteness({
      ...EMPTY,
      titleHy: "Վերնագիր",
      synopsisHy: "Համառոտագիր",
      taglineHy: "Կարգախոս",
    });
    expect(hyOnly.find((i) => i.key === "translations")?.filled).toBe(false);
    expect(projectCompleteness(FULL).find((i) => i.key === "translations")?.filled).toBe(true);
  });

  it("counts cast photos separately from a bare cast count", () => {
    const namedNoPhotos = projectCompleteness({ ...EMPTY, castCount: 3, castPhotoCount: 0 });
    expect(namedNoPhotos.find((i) => i.key === "cast")?.filled).toBe(true);
    expect(namedNoPhotos.find((i) => i.key === "castPhotos")?.filled).toBe(false);
  });

  it("fills placementPricing once at least one placement carries a price", () => {
    const unpriced = projectCompleteness({ ...EMPTY, placementPricing: [{ priceAmd: null }] });
    expect(unpriced.find((i) => i.key === "placementPricing")?.filled).toBe(false);
    const onePriced = projectCompleteness({
      ...EMPTY,
      placementPricing: [{ priceAmd: null }, { priceAmd: 300_000 }],
    });
    expect(onePriced.find((i) => i.key === "placementPricing")?.filled).toBe(true);
  });

  it("treats an omitted optional field the same as an absent one", () => {
    // The list-badge pages don't fetch countries/castPhotoCount/per-locale
    // text/placementPricing at all — confirm the object literal doesn't need
    // them to compile or to run.
    const minimal: CompletenessInput = {
      tagline: "x",
      poster: "/p.jpg",
      videoEmbedUrl: null,
      videoFile: null,
      gallery: null,
      castCount: 0,
      milestonesCount: 0,
      placementsCount: 0,
      tiers: [],
      studio: "Studio",
      kind: "FILM",
      episodes: null,
      episodeMinutes: null,
      durationMinutes: 90,
      references: null,
      applicationDeadline: null,
      applicationDeadlineOngoing: true,
      releaseDate: null,
      platforms: null,
      cinemas: null,
      productionBudgetAmd: null,
      ageRating: null,
      formatCategory: "FEATURE",
    };
    const items = projectCompleteness(minimal);
    expect(items.find((i) => i.key === "countries")?.filled).toBe(false);
    expect(items.find((i) => i.key === "castPhotos")?.filled).toBe(false);
    expect(items.find((i) => i.key === "translations")?.filled).toBe(false);
    expect(items.find((i) => i.key === "placementPricing")?.filled).toBe(false);
  });

  it("treats an empty JSON gallery array as unfilled, not just null", () => {
    const items = projectCompleteness({ ...FULL, gallery: "[]" });
    expect(items.find((i) => i.key === "gallery")?.filled).toBe(false);
  });

  it("fills video from either the embed URL or the uploaded file", () => {
    const embedOnly = projectCompleteness({ ...EMPTY, videoEmbedUrl: "https://youtube.com/x" });
    expect(embedOnly.find((i) => i.key === "video")?.filled).toBe(true);

    const fileOnly = projectCompleteness({ ...EMPTY, videoFile: "/uploads/videos/x.mp4" });
    expect(fileOnly.find((i) => i.key === "video")?.filled).toBe(true);

    const neither = projectCompleteness(EMPTY);
    expect(neither.find((i) => i.key === "video")?.filled).toBe(false);
  });

  it("does not count a package with no benefits list as a filled section", () => {
    // publishBlockers() refuses publication for exactly this shape, so the
    // checklist must not report the section as done.
    const items = projectCompleteness({ ...FULL, tiers: [{ benefits: "   " }] });
    expect(items.find((i) => i.key === "tiers")?.filled).toBe(false);
  });

  it("counts runtime from episodes for a serial and from duration for a film", () => {
    const serial = projectCompleteness({ ...EMPTY, kind: "SERIAL", episodes: 12, episodeMinutes: 11 });
    expect(serial.find((i) => i.key === "runtime")?.filled).toBe(true);
    const film = projectCompleteness({ ...EMPTY, kind: "FILM", durationMinutes: 96 });
    expect(film.find((i) => i.key === "runtime")?.filled).toBe(true);
    const halfSerial = projectCompleteness({ ...EMPTY, kind: "SERIAL", episodes: 12 });
    expect(halfSerial.find((i) => i.key === "runtime")?.filled).toBe(false);
  });

  it("flags exactly what publishBlockers() refuses publication for", () => {
    // EMPTY carries no createdAt (the same as a project being created right
    // now), so the placements grandfather clause does NOT apply here —
    // "placements" is expected to block, same as the other requirements.
    const items = projectCompleteness(EMPTY);
    const blocking = items.filter((i) => i.blocksPublish).map((i) => i.key);
    // Mirrors publishBlockers() in form-shared.ts — the checklist must not
    // say "all filled" for a project publication will then refuse. Release
    // date is NOT in this list (IA-42, 2026-08-01) — it's still shown as a
    // section, just never blocks publication any more. Poster/placements/
    // formatCategory/deadline joined the set 2026-08-04; the four part-(b)
    // advisory items (countries/castPhotos/translations/placementPricing)
    // deliberately never do.
    expect(blocking.sort()).toEqual([
      "deadline",
      "formatCategory",
      "placements",
      "poster",
      "runtime",
      "studio",
      "tagline",
      "tiers",
    ]);
  });

  // ── Placements grandfather clause (owner decision 2026-08-04) ────────────
  // Mirrors the form-shared.test.ts suite of the same name — the module
  // comment promises projectCompleteness() and publishBlockers() agree
  // exactly, so this needs the same three cases.
  describe("placements grandfather clause", () => {
    it("does not mark placements as blocking for a project created before the cutoff", () => {
      const old = projectCompleteness({
        ...EMPTY,
        createdAt: new Date(PLACEMENTS_REQUIRED_FROM.getTime() - 24 * 60 * 60 * 1000),
      });
      expect(old.find((i) => i.key === "placements")?.blocksPublish).toBe(false);
      // Still shown as unfilled — grandfathered only means it doesn't block.
      expect(old.find((i) => i.key === "placements")?.filled).toBe(false);
    });

    it("marks placements as blocking for a project created at/after the cutoff", () => {
      const atCutoff = projectCompleteness({
        ...EMPTY,
        createdAt: new Date(PLACEMENTS_REQUIRED_FROM),
      });
      expect(atCutoff.find((i) => i.key === "placements")?.blocksPublish).toBe(true);
    });

    it("marks placements as blocking when createdAt is omitted (a project being created now)", () => {
      const items = projectCompleteness(EMPTY);
      expect(items.find((i) => i.key === "placements")?.blocksPublish).toBe(true);
    });

    it("never grandfathers poster/formatCategory/deadline, even for an old project", () => {
      const old = projectCompleteness({
        ...EMPTY,
        createdAt: new Date(PLACEMENTS_REQUIRED_FROM.getTime() - 24 * 60 * 60 * 1000),
      });
      expect(old.find((i) => i.key === "poster")?.blocksPublish).toBe(true);
      expect(old.find((i) => i.key === "formatCategory")?.blocksPublish).toBe(true);
      expect(old.find((i) => i.key === "deadline")?.blocksPublish).toBe(true);
    });
  });

  // ── IA-42: Ongoing deadline counts as filled ──────────────────────────────
  it("counts an Ongoing deadline as filled even with no applicationDeadline date", () => {
    const items = projectCompleteness({ ...EMPTY, applicationDeadlineOngoing: true });
    expect(items.find((i) => i.key === "deadline")?.filled).toBe(true);
  });

  it("counts a reference row with an uploaded still but no title as filled", () => {
    const raw = JSON.stringify([{ name: "", url: "", media: "/uploads/references/still.jpg" }]);
    const items = projectCompleteness({ ...EMPTY, references: raw });
    expect(items.find((i) => i.key === "references")?.filled).toBe(true);
  });
});
