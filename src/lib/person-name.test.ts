import { describe, expect, it } from "vitest";
import { allSpellings, guessNameLocale, pickPersonName, seedNames } from "./person-name";

const ARAM = { nameHy: "Արամ Խաչատրյան", nameRu: "Арам Хачатрян", nameEn: "Aram Khachatryan" };

describe("pickPersonName", () => {
  it("returns the spelling of the asked-for locale", () => {
    expect(pickPersonName("hy", ARAM, "base")).toBe("Արամ Խաչատրյան");
    expect(pickPersonName("ru", ARAM, "base")).toBe("Арам Хачатрян");
    expect(pickPersonName("en", ARAM, "base")).toBe("Aram Khachatryan");
  });

  it("falls back to English when the locale column is empty", () => {
    const partial = { nameHy: "Արամ", nameRu: "", nameEn: "Aram" };
    expect(pickPersonName("ru", partial, "base")).toBe("Aram");
  });

  it("falls back to the legacy base when nothing else is filled in", () => {
    expect(pickPersonName("ru", { nameHy: "", nameRu: "", nameEn: "" }, "Ռաֆայել")).toBe("Ռաֆայել");
    expect(pickPersonName("en", {}, "Ռաֆայել")).toBe("Ռաֆայել");
  });

  it("treats whitespace-only as empty", () => {
    expect(pickPersonName("ru", { nameHy: "", nameRu: "   ", nameEn: "Aram" }, "base")).toBe("Aram");
  });
});

describe("guessNameLocale", () => {
  it("detects Armenian script", () => {
    expect(guessNameLocale("Ռաֆայել Թադևոսյան")).toBe("hy");
    expect(guessNameLocale("և")).toBe("hy");
  });

  it("treats anything else as English", () => {
    expect(guessNameLocale("Henrikh Mkhitaryan")).toBe("en");
    expect(guessNameLocale("")).toBe("en");
  });
});

describe("seedNames", () => {
  it("puts an Armenian name in the hy column only", () => {
    expect(seedNames("Ռաֆայել")).toEqual({ nameHy: "Ռաֆայել", nameRu: "", nameEn: "" });
  });

  it("puts a Latin name in the en column only", () => {
    expect(seedNames("Nare Sahakyan")).toEqual({ nameHy: "", nameRu: "", nameEn: "Nare Sahakyan" });
  });

  it("honours an explicit locale — a creator types in their own language", () => {
    expect(seedNames("Арам", "ru")).toEqual({ nameHy: "", nameRu: "Арам", nameEn: "" });
  });

  it("trims", () => {
    expect(seedNames("  Aram  ").nameEn).toBe("Aram");
  });
});

describe("allSpellings", () => {
  it("collects every non-empty spelling, base first", () => {
    expect(allSpellings(ARAM, "Արամ Խաչատրյան")).toEqual([
      "Արամ Խաչատրյան",
      "Արամ Խաչատրյան",
      "Арам Хачатрян",
      "Aram Khachatryan",
    ]);
  });

  it("drops blanks", () => {
    expect(allSpellings({ nameHy: "", nameRu: "  ", nameEn: "Aram" }, "")).toEqual(["Aram"]);
  });
});
