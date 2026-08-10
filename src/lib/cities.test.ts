import { describe, it, expect } from "vitest";
import { CITY_VALUES, canonicalCityToken, localizeCity } from "@/lib/cities";

describe("localizeCity", () => {
  it("translates a canonical key", () => {
    expect(localizeCity("hy", "Yerevan")).toBe("Երևան");
    expect(localizeCity("ru", "Yerevan")).toBe("Ереван");
    expect(localizeCity("en", "Yerevan")).toBe("Yerevan");
  });

  it("resolves an alias (the hy spelling actually stored in the DB) before translating", () => {
    expect(localizeCity("ru", "Երևան")).toBe("Ереван");
    expect(localizeCity("en", "Երևան")).toBe("Yerevan");
    // Round-trips to itself in hy.
    expect(localizeCity("hy", "Երևան")).toBe("Երևան");
  });

  it("resolves the pre-Soviet alt-name alias", () => {
    expect(localizeCity("en", "Echmiadzin")).toBe("Vagharshapat");
  });

  // Same "no canonical entry, print as-is" fallback as localizeCountry — a
  // village or a typo must never render blank or "undefined".
  it("passes an unknown token through unchanged, in every locale", () => {
    expect(localizeCity("hy", "Meghri")).toBe("Meghri");
    expect(localizeCity("ru", "Meghri")).toBe("Meghri");
    expect(localizeCity("en", "Meghri")).toBe("Meghri");
  });
});

describe("canonicalCityToken", () => {
  it("resolves a known alias to its canonical key", () => {
    expect(canonicalCityToken("Երևան")).toBe("Yerevan");
    expect(canonicalCityToken("Ереван")).toBe("Yerevan");
  });

  it("leaves an already-canonical or unknown value unchanged", () => {
    expect(canonicalCityToken("Yerevan")).toBe("Yerevan");
    expect(canonicalCityToken("Meghri")).toBe("Meghri");
    expect(canonicalCityToken("")).toBe("");
  });
});

describe("CITY_VALUES", () => {
  it("is the City table's seed — every entry has a label", () => {
    expect(CITY_VALUES.length).toBeGreaterThan(0);
    expect(CITY_VALUES).toContain("Yerevan");
  });
});
