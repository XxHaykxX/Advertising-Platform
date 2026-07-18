import { describe, it, expect } from "vitest";
import { deriveFormatCategory, FORMAT_CATEGORY_VALUES } from "./form-shared";

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
