import { describe, expect, it } from "vitest";
import { showsBrandNav } from "@/lib/nav-mode";

const brand = { isCreator: false, isBrand: true };
const dual = { isCreator: true, isBrand: true };
const creator = { isCreator: true, isBrand: false };

describe("showsBrandNav", () => {
  it("keeps the brand links on public pages (the 2026-08-11 regression)", () => {
    for (const path of ["/catalog", "/", "/ads/tv", "/reports/27"]) {
      expect(showsBrandNav(brand, path)).toBe(true);
    }
  });

  it("hides them while a dual member is in the creator cabinet", () => {
    expect(showsBrandNav(dual, "/account")).toBe(false);
    expect(showsBrandNav(dual, "/account/projects")).toBe(false);
    expect(showsBrandNav(dual, "/account/brand")).toBe(true);
    expect(showsBrandNav(dual, "/account/brand/favorites")).toBe(true);
  });

  it("never shows them to a creator-only member, a guest or staff", () => {
    expect(showsBrandNav(creator, "/catalog")).toBe(false);
    expect(showsBrandNav(null, "/catalog")).toBe(false);
    expect(showsBrandNav({ isCreator: false, isBrand: false }, "/catalog")).toBe(false);
  });
});
