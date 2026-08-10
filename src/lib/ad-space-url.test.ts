import { describe, it, expect } from "vitest";
import { adSpaceCodeFromSlug, adSpacePath, adSpaceSlug } from "./ad-space-url";

describe("ad-space URL codec", () => {
  it("round-trips a stored code through a route param", () => {
    const code = "#AS-2026-0417";
    // Next hands the page the already-decoded segment.
    expect(adSpaceCodeFromSlug(decodeURIComponent(adSpaceSlug(code)))).toBe(code);
  });

  it("keeps the hash out of the URL", () => {
    expect(adSpacePath("billboard", "#AS-2026-0417")).toBe("/ads/billboard/AS-2026-0417");
  });

  it("resolves a segment that still carries the hash", () => {
    expect(adSpaceCodeFromSlug("#AS-2026-0417")).toBe("#AS-2026-0417");
  });
});
