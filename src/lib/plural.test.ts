import { describe, it, expect } from "vitest";
import { pluralForm } from "@/lib/plural";
import { UI } from "@/lib/i18n";

function catalogCount(prefix: "project" | "adSpace", locale: "ru" | "en" | "hy", n: number): string {
  const key = `catalog.${prefix}Count.${pluralForm(locale, n)}`;
  return (UI[key] as Record<string, string>)[locale].replaceAll("{n}", String(n));
}

// QA-9: "Показано 5 проектов · 2 рекламных мест" — the second half needed
// Russian's paucal form ("2 места") and got the "many" one ("мест") instead,
// because the count line used a plain n===1 ? singular : plural switch.
describe("pluralForm", () => {
  it("ru: one / few / many", () => {
    expect(pluralForm("ru", 1)).toBe("one");
    expect(pluralForm("ru", 2)).toBe("few");
    expect(pluralForm("ru", 5)).toBe("many");
  });

  it("en: only one / many (no CLDR 'few')", () => {
    expect(pluralForm("en", 1)).toBe("one");
    expect(pluralForm("en", 2)).toBe("many");
    expect(pluralForm("en", 5)).toBe("many");
  });

  it("hy: only one / many (CLDR has no 'few' either)", () => {
    expect(pluralForm("hy", 1)).toBe("one");
    expect(pluralForm("hy", 2)).toBe("many");
    expect(pluralForm("hy", 5)).toBe("many");
  });
});

// End-to-end: the exact strings the catalog's result-count line renders —
// catches a future typo in the ru declension, not just the form selection.
describe("catalog count strings", () => {
  it("ru declines the noun for 1 / 2 / 5", () => {
    expect(catalogCount("project", "ru", 1)).toBe("1 проект");
    expect(catalogCount("project", "ru", 2)).toBe("2 проекта");
    expect(catalogCount("project", "ru", 5)).toBe("5 проектов");
    expect(catalogCount("adSpace", "ru", 1)).toBe("1 рекламное место");
    expect(catalogCount("adSpace", "ru", 2)).toBe("2 рекламных места");
    expect(catalogCount("adSpace", "ru", 5)).toBe("5 рекламных мест");
  });

  it("en and hy stay grammatical at 1 / 2 / 5 too", () => {
    expect(catalogCount("project", "en", 1)).toBe("1 project");
    expect(catalogCount("project", "en", 2)).toBe("2 projects");
    expect(catalogCount("project", "en", 5)).toBe("5 projects");
    expect(catalogCount("project", "hy", 1)).toBe("1 նախագիծ");
    expect(catalogCount("project", "hy", 2)).toBe("2 նախագիծ");
    expect(catalogCount("project", "hy", 5)).toBe("5 նախագիծ");
  });
});
