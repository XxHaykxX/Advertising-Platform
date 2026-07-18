import { describe, it, expect } from "vitest";
import {
  parseStringArray,
  splitCountries,
  formatMonthYear,
  formatFullDate,
  daysUntil,
} from "./format";

describe("splitCountries", () => {
  it("returns [] for empty/null-ish input", () => {
    expect(splitCountries("")).toEqual([]);
  });

  it("splits a plain comma list", () => {
    expect(splitCountries("Armenia, Russia, Georgia")).toEqual([
      "Armenia",
      "Russia",
      "Georgia",
    ]);
  });

  it("keeps a parenthesised group intact (the ԱՐԱՄ/Diaspora bug)", () => {
    expect(splitCountries("Armenia, Georgia, Diaspora (US, France)")).toEqual([
      "Armenia",
      "Georgia",
      "Diaspora (US, France)",
    ]);
  });

  it("handles nested parens without over-splitting", () => {
    expect(splitCountries("A (x, y (z, w)), B")).toEqual(["A (x, y (z, w))", "B"]);
  });

  it("trims whitespace and drops empty segments", () => {
    expect(splitCountries("Armenia ,, Russia")).toEqual(["Armenia", "Russia"]);
  });

  it("tolerates an unbalanced closing paren (depth never goes negative)", () => {
    expect(splitCountries("A), B")).toEqual(["A)", "B"]);
  });
});

describe("parseStringArray", () => {
  it("returns [] for null", () => {
    expect(parseStringArray(null)).toEqual([]);
  });

  it("parses a JSON string array", () => {
    expect(parseStringArray('["a","b"]')).toEqual(["a", "b"]);
  });

  it("filters out non-string members", () => {
    expect(parseStringArray('["a",1,null,"b"]')).toEqual(["a", "b"]);
  });

  it("returns [] on malformed JSON", () => {
    expect(parseStringArray("{not json")).toEqual([]);
  });

  it("returns [] when the JSON is not an array", () => {
    expect(parseStringArray('{"a":1}')).toEqual([]);
  });
});

describe("formatMonthYear", () => {
  it("formats English month + year", () => {
    expect(formatMonthYear("2026-10-15T00:00:00.000Z", "en-US")).toBe("October 2026");
  });

  it("formats Armenian with the year-first pattern", () => {
    expect(formatMonthYear("2026-10-15T00:00:00.000Z", "hy-AM")).toBe("2026 թ. հոկտեմբեր");
  });

  it("returns '' for null or invalid input", () => {
    expect(formatMonthYear(null, "en-US")).toBe("");
    expect(formatMonthYear("not-a-date", "en-US")).toBe("");
  });
});

describe("formatFullDate", () => {
  it("uses genitive month for Russian day-first order", () => {
    expect(formatFullDate("2026-08-10T00:00:00.000Z", "ru-RU")).toBe("10 августа 2026");
  });

  it("uses 'Month day, year' for English", () => {
    expect(formatFullDate("2026-08-10T00:00:00.000Z", "en-US")).toBe("August 10, 2026");
  });

  it("returns '' for invalid input", () => {
    expect(formatFullDate("", "en-US")).toBe("");
  });
});

describe("daysUntil", () => {
  it("returns null for null/invalid", () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil("nope")).toBeNull();
  });

  it("is positive for a future date and negative for a past one", () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(daysUntil(future)).toBeGreaterThan(0);
    expect(daysUntil(past)).toBeLessThan(0);
  });
});
