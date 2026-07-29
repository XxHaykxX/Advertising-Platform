import { describe, it, expect } from "vitest";
import { splitCountries } from "@/lib/data/format";

// The catalog's Country facet is built from these values, so a naive split on
// "," turned one project shot in "Diaspora (US, France)" into two bogus facets
// ("Diaspora (US" and "France)"). That used to be guarded only by an e2e
// assertion on a specific seeded project, which quietly stopped meaning
// anything once the local dataset changed — the rule belongs here.
describe("splitCountries", () => {
  it("splits a plain comma-separated list", () => {
    expect(splitCountries("Armenia, Georgia, France")).toEqual(["Armenia", "Georgia", "France"]);
  });

  it("keeps a comma inside parentheses with its value", () => {
    expect(splitCountries("Armenia, Diaspora (US, France)")).toEqual([
      "Armenia",
      "Diaspora (US, France)",
    ]);
  });

  it("handles nested parentheses", () => {
    expect(splitCountries("A (B (C, D), E), F")).toEqual(["A (B (C, D), E)", "F"]);
  });

  it("drops empty segments and trims", () => {
    expect(splitCountries("Armenia,  , France,")).toEqual(["Armenia", "France"]);
  });

  it("returns nothing for an empty string", () => {
    expect(splitCountries("")).toEqual([]);
  });

  it("survives an unbalanced closing bracket", () => {
    expect(splitCountries("Armenia), France")).toEqual(["Armenia)", "France"]);
  });
});
