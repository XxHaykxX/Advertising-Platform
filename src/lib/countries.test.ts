import { describe, it, expect } from "vitest";
import { localizeCountry, localizeCountryList } from "@/lib/countries";

// QA-7: the report page and the catalog turned out to already share this
// exact function (src/lib/data/projects.ts calls it for both the list and
// detail DTO) — the reported "catalog prints a raw token" symptom traced to
// non-canonical DB rows (QA-3), not a missing localizer call. This locks the
// contract in so nothing quietly re-splits it per page again.
describe("localizeCountry", () => {
  it("translates a canonical token", () => {
    expect(localizeCountry("hy", "Armenia")).toBe("Հայաստան");
    expect(localizeCountry("ru", "Armenia")).toBe("Армения");
  });

  it("resolves a legacy spelling through ALIASES before translating", () => {
    expect(localizeCountry("ru", "US")).toBe("США");
  });

  it("returns the canonical key unchanged for en", () => {
    expect(localizeCountry("en", "Armenia")).toBe("Armenia");
  });

  // Owner decision: "Diaspora (US, France)" has no COUNTRY_LABELS entry and
  // never has — the fallback must hand the token back as-is, not blank it or
  // print "undefined".
  it("passes an unknown token through unchanged, in every locale", () => {
    expect(localizeCountry("hy", "Diaspora (US, France)")).toBe("Diaspora (US, France)");
    expect(localizeCountry("ru", "Diaspora (US, France)")).toBe("Diaspora (US, France)");
    expect(localizeCountry("en", "Diaspora (US, France)")).toBe("Diaspora (US, France)");
  });
});

describe("localizeCountryList", () => {
  it("localizes every canonical entry in a CSV", () => {
    expect(localizeCountryList("hy", "Armenia, Russia, Georgia")).toBe(
      "Հայաստան, Ռուսաստան, Վրաստան",
    );
  });

  it("returns an empty string unchanged", () => {
    expect(localizeCountryList("hy", "")).toBe("");
  });
});
