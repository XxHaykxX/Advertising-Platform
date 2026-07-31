import { describe, it, expect } from "vitest";
import { projectCompleteness, missingCount, type CompletenessInput } from "./project-completeness";

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
  releaseDate: "2026-10-01",
  platforms: JSON.stringify(["YouTube"]),
  cinemas: "Cinema Star",
  productionBudgetAmd: 5_000_000,
  ageRating: "12+",
  formatCategory: "SERIES",
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
  releaseDate: null,
  platforms: null,
  cinemas: null,
  productionBudgetAmd: null,
  ageRating: null,
  formatCategory: null,
};

describe("projectCompleteness", () => {
  it("marks every item filled for a fully-filled project", () => {
    const items = projectCompleteness(FULL);
    expect(items).toHaveLength(18);
    expect(missingCount(items)).toBe(0);
    expect(items.every((i) => i.filled)).toBe(true);
  });

  it("marks every item empty for a blank project", () => {
    const items = projectCompleteness(EMPTY);
    expect(missingCount(items)).toBe(18);
    expect(items.every((i) => !i.filled)).toBe(true);
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
    const items = projectCompleteness(EMPTY);
    const blocking = items.filter((i) => i.blocksPublish).map((i) => i.key);
    // Mirrors publishBlockers() in form-shared.ts — the checklist must not
    // say "all filled" for a project publication will then refuse.
    expect(blocking.sort()).toEqual(["releaseDate", "runtime", "studio", "tagline", "tiers"]);
  });

  it("counts a reference row with an uploaded still but no title as filled", () => {
    const raw = JSON.stringify([{ name: "", url: "", media: "/uploads/references/still.jpg" }]);
    const items = projectCompleteness({ ...EMPTY, references: raw });
    expect(items.find((i) => i.key === "references")?.filled).toBe(true);
  });
});
