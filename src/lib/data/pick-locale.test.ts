import { describe, expect, it } from "vitest";
import {
  pickLocale,
  pickLocaleList,
  pickPlacementTitle,
  pickTierName,
} from "@/lib/data/pick-locale";

const json = (...items: string[]) => JSON.stringify(items);

describe("pickLocale", () => {
  it("prefers the reader's own locale", () => {
    expect(pickLocale("ru", { hy: "Հ", ru: "Р", en: "E" }, "base")).toBe("Р");
    expect(pickLocale("hy", { hy: "Հ", ru: "Р", en: "E" }, "base")).toBe("Հ");
  });

  it("falls through the locale to English to the legacy column", () => {
    expect(pickLocale("ru", { hy: "Հ", ru: "", en: "E" }, "base")).toBe("E");
    // A row written before the language tabs existed: only the legacy column
    // is filled, and it must still be what the reader sees.
    expect(pickLocale("ru", { hy: "", ru: "", en: "" }, "base")).toBe("base");
  });
});

describe("pickLocaleList", () => {
  it("prefers the reader's own locale", () => {
    expect(
      pickLocaleList("ru", { hy: json("Հ"), ru: json("Р1", "Р2"), en: json("E") }, json("b")),
    ).toEqual(["Р1", "Р2"]);
  });

  it("treats an empty list as no value, not as a value of none", () => {
    // "[]" is a perfectly truthy string, so a naive chain would stop on the
    // locale the editor opened and left empty and render no bullets at all
    // while a filled fallback sat right next to it.
    expect(pickLocaleList("ru", { hy: json("Հ"), ru: "[]", en: "" }, json("b"))).toEqual(["b"]);
    expect(pickLocaleList("ru", { hy: "", ru: null, en: null }, json("b1", "b2"))).toEqual([
      "b1",
      "b2",
    ]);
  });

  it("survives malformed JSON instead of throwing on a bad row", () => {
    expect(pickLocaleList("ru", { hy: null, ru: "not json", en: null }, json("b"))).toEqual(["b"]);
    expect(pickLocaleList("ru", { hy: null, ru: null, en: null }, "also not json")).toEqual([]);
  });
});

describe("offer name helpers", () => {
  it("names an offer in the reader's language, legacy column as the fallback", () => {
    const tier = { name: "Legacy", nameHy: "Գլխավոր", nameRu: "Генеральный", nameEn: "" };
    expect(pickTierName("ru", tier)).toBe("Генеральный");
    expect(pickTierName("hy", tier)).toBe("Գլխավոր");
    // en is blank, and the en fallback is the same blank -> the legacy column.
    expect(pickTierName("en", tier)).toBe("Legacy");
  });

  it("returns an empty string for an application that named no offer", () => {
    // Both are nullable on Interest — an application can name neither.
    expect(pickTierName("ru", null)).toBe("");
    expect(pickPlacementTitle("ru", undefined)).toBe("");
  });
});
