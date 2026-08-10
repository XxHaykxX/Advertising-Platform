import { describe, it, expect } from "vitest";
import {
  parseStringArray,
  splitCountries,
  formatMonthYear,
  formatFullDate,
  formatReleaseDate,
  formatDuration,
  daysUntil,
  isArchived,
  compareDeadline,
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

// ── formatReleaseDate (IA-42) — precision-aware, all three locales ────────
// Never inventing a day/month the editor didn't actually save.
describe("formatReleaseDate", () => {
  const iso = "2027-07-15T00:00:00.000Z";

  it("DAY renders the full date on the project page (compact=false)", () => {
    expect(formatReleaseDate(iso, "DAY", "en-US", false)).toBe("July 15, 2027");
    expect(formatReleaseDate(iso, "DAY", "ru-RU", false)).toBe("15 июля 2027");
    expect(formatReleaseDate(iso, "DAY", "hy-AM", false)).toBe("15 հուլիսի 2027");
  });

  it("DAY renders month + year on the compact cards (compact=true) — unchanged from before precision existed", () => {
    expect(formatReleaseDate(iso, "DAY", "en-US", true)).toBe("July 2027");
    expect(formatReleaseDate(iso, "DAY", "ru-RU", true)).toBe("июль 2027");
    expect(formatReleaseDate(iso, "DAY", "hy-AM", true)).toBe("2027 թ. հուլիս");
  });

  it("MONTH renders month + year regardless of `compact`", () => {
    expect(formatReleaseDate(iso, "MONTH", "en-US", false)).toBe("July 2027");
    expect(formatReleaseDate(iso, "MONTH", "en-US", true)).toBe("July 2027");
    expect(formatReleaseDate(iso, "MONTH", "ru-RU", false)).toBe("июль 2027");
    expect(formatReleaseDate(iso, "MONTH", "hy-AM", false)).toBe("2027 թ. հուլիս");
  });

  it("YEAR renders just the year, hy keeping its 'թ.' suffix, regardless of `compact`", () => {
    expect(formatReleaseDate(iso, "YEAR", "en-US", false)).toBe("2027");
    expect(formatReleaseDate(iso, "YEAR", "en-US", true)).toBe("2027");
    expect(formatReleaseDate(iso, "YEAR", "ru-RU", false)).toBe("2027");
    expect(formatReleaseDate(iso, "YEAR", "hy-AM", false)).toBe("2027 թ.");
  });

  it("returns '' for null/invalid input at every precision", () => {
    expect(formatReleaseDate(null, "DAY", "en-US")).toBe("");
    expect(formatReleaseDate(null, "YEAR", "en-US")).toBe("");
    expect(formatReleaseDate("not-a-date", "MONTH", "en-US")).toBe("");
  });

  it("falls back to DAY for an unrecognized precision value", () => {
    expect(formatReleaseDate(iso, "", "en-US", true)).toBe("July 2027");
  });
});

// ── formatDuration (IA-50 §7) — clock time instead of raw minutes ─────────
describe("formatDuration", () => {
  it("under an hour: minutes only", () => {
    expect(formatDuration(43, "en")).toBe("43 min");
    expect(formatDuration(43, "ru")).toBe("43 мин");
    expect(formatDuration(43, "hy")).toBe("43 րոպե");
  });

  it("exact hours: no trailing '0 min'", () => {
    expect(formatDuration(120, "en")).toBe("2 hr");
    expect(formatDuration(120, "ru")).toBe("2 ч");
    expect(formatDuration(120, "hy")).toBe("2 ժամ");
  });

  it("hours + minutes", () => {
    expect(formatDuration(103, "en")).toBe("1 hr 43 min");
    expect(formatDuration(103, "ru")).toBe("1 ч 43 мин");
    expect(formatDuration(103, "hy")).toBe("1 ժամ 43 րոպե");
  });

  it("returns '' for zero/negative/non-finite input", () => {
    expect(formatDuration(0, "en")).toBe("");
    expect(formatDuration(-5, "en")).toBe("");
    expect(formatDuration(NaN, "en")).toBe("");
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

describe("isArchived", () => {
  it("is false when there is no deadline at all", () => {
    // A project without a placement deadline never expires on its own.
    expect(isArchived(null)).toBe(false);
    expect(isArchived("nonsense")).toBe(false);
  });

  it("is false while the deadline is still ahead", () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(isArchived(future)).toBe(false);
  });

  it("is true once the deadline is behind us", () => {
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(isArchived(past)).toBe(true);
  });

  it("keeps the deadline day itself open", () => {
    // Deadlines are stored as UTC midnight of the chosen day; that whole day
    // still accepts offers, matching the "Applications until <date>" copy.
    const today = new Date();
    const midnightToday = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    ).toISOString();
    expect(isArchived(midnightToday)).toBe(false);
  });

  // ── IA-42: Ongoing never archives ────────────────────────────────────────
  it("is false when ongoing, whatever applicationDeadline holds (it's always null in practice)", () => {
    expect(isArchived(null, true)).toBe(false);
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    // Defensive: even a stray non-null deadline must not override the flag.
    expect(isArchived(past, true)).toBe(false);
  });

  it("defaults to non-ongoing (existing call sites are unaffected)", () => {
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(isArchived(past)).toBe(true);
  });
});

describe("compareDeadline", () => {
  const dated = (iso: string) => ({ applicationDeadline: iso, applicationDeadlineOngoing: false });
  const ongoing = { applicationDeadline: null, applicationDeadlineOngoing: true };
  const unset = { applicationDeadline: null, applicationDeadlineOngoing: false };

  it("sorts dated projects soonest first", () => {
    const soon = dated("2026-09-01");
    const later = dated("2026-12-01");
    expect(compareDeadline(soon, later)).toBeLessThan(0);
    expect(compareDeadline(later, soon)).toBeGreaterThan(0);
  });

  it("places Ongoing after every dated project", () => {
    expect(compareDeadline(ongoing, dated("2026-09-01"))).toBeGreaterThan(0);
    expect(compareDeadline(dated("2026-09-01"), ongoing)).toBeLessThan(0);
  });

  it("places a project with no deadline at all after Ongoing", () => {
    expect(compareDeadline(unset, ongoing)).toBeGreaterThan(0);
    expect(compareDeadline(ongoing, unset)).toBeLessThan(0);
  });

  it("treats two Ongoing (or two unset) projects as equal", () => {
    expect(compareDeadline(ongoing, ongoing)).toBe(0);
    expect(compareDeadline(unset, unset)).toBe(0);
  });
});
