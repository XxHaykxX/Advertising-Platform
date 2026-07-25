import { describe, it, expect } from "vitest";
import { validateEntry, validateBatch, isChanged } from "./i18n-validate";
import type { Values } from "./i18n-validate";

const REF: Values = { ru: "Всего {count}", en: "Total {count}", hy: "Ընդամենը {count}" };

describe("validateEntry", () => {
  it("reports an empty cell in each locale", () => {
    const values: Values = { ru: "", en: "Total {count}", hy: "Ընդամենը {count}" };
    const issues = validateEntry("k", values, REF);
    expect(issues).toContainEqual({ key: "k", locale: "ru", message: "Пусто в русском" });
  });

  it("reports an empty cell in en", () => {
    const values: Values = { ru: "Всего {count}", en: "", hy: "Ընդամենը {count}" };
    const issues = validateEntry("k", values, REF);
    expect(issues).toContainEqual({ key: "k", locale: "en", message: "Пусто в английском" });
  });

  it("reports an empty cell in hy", () => {
    const values: Values = { ru: "Всего {count}", en: "Total {count}", hy: "" };
    const issues = validateEntry("k", values, REF);
    expect(issues).toContainEqual({ key: "k", locale: "hy", message: "Пусто в армянском" });
  });

  it("flags a Cyrillic homoglyph inside an Armenian value", () => {
    // "А" here is Cyrillic U+0410, not the Armenian letters around it.
    const values: Values = { ru: "Всего {count}", en: "Total {count}", hy: "Ընդամենը А {count}" };
    const issues = validateEntry("k", values, REF);
    const hit = issues.find((i) => i.locale === "hy" && /Кириллическая/.test(i.message));
    expect(hit).toBeDefined();
    expect(hit!.message).toContain("А");
  });

  it("flags a placeholder mismatch against the reference English string", () => {
    const values: Values = { ru: "Всего {n}", en: "Total {count}", hy: "Ընդամենը {count}" };
    const issues = validateEntry("k", values, REF);
    const hit = issues.find((i) => i.locale === "ru" && /Плейсхолдеры не совпадают/.test(i.message));
    expect(hit).toBeDefined();
  });

  it("returns no issues for a valid entry matching the reference", () => {
    const values: Values = { ru: "Всего {count}", en: "Total {count}", hy: "Ընդամենը {count}" };
    expect(validateEntry("k", values, REF)).toEqual([]);
  });
});

describe("validateBatch", () => {
  const dictionary: Record<string, Values> = { "nav.catalog": REF };

  it("reports an unknown key not present in the code dictionary", () => {
    const edits = new Map<string, Values>([
      ["nope.key", { ru: "a", en: "b", hy: "c" }],
    ]);
    const issues = validateBatch(edits, dictionary);
    expect(issues).toEqual([
      { key: "nope.key", locale: null, message: "Неизвестный ключ — его нет в словаре кода" },
    ]);
  });

  it("validates each known key against its dictionary reference", () => {
    const edits = new Map<string, Values>([
      ["nav.catalog", { ru: "", en: "Total {count}", hy: "Ընդամենը {count}" }],
    ]);
    const issues = validateBatch(edits, dictionary);
    expect(issues).toContainEqual({ key: "nav.catalog", locale: "ru", message: "Пусто в русском" });
  });

  it("returns an empty array when every edit is valid", () => {
    const edits = new Map<string, Values>([["nav.catalog", { ...REF }]]);
    expect(validateBatch(edits, dictionary)).toEqual([]);
  });
});

describe("isChanged", () => {
  it("is true when at least one locale differs from the reference", () => {
    const values: Values = { ...REF, en: "Total {count} (edited)" };
    expect(isChanged(values, REF)).toBe(true);
  });

  it("is false when every locale matches the reference", () => {
    const values: Values = { ...REF };
    expect(isChanged(values, REF)).toBe(false);
  });
});
