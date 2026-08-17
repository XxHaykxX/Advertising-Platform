import { describe, expect, it } from "vitest";
import {
  cropAspectForDir,
  formatRequiredSize,
  imageBelowRequired,
  SQUARE_ASPECT,
  WIDE_ASPECT,
} from "./size-hint";

/** Every folder an upload actually lands in today, with the frame the crop
 *  dialog must offer for it. The point is the mapping, not the function: the
 *  dialog is derived from the destination now (media-picker / media-field /
 *  image-uploader all call cropAspectForDir), so a renamed folder that stops
 *  matching kindForDir's substrings silently drops the dialog and hands the
 *  cut back to the server. This list fails when that happens. */
const DIRS: Record<string, number | null> = {
  projects: WIDE_ASPECT, // poster + gallery
  "ad-spaces": WIDE_ASPECT,
  portfolio: WIDE_ASPECT,
  references: WIDE_ASPECT,
  videos: WIDE_ASPECT, // image fields only — video never reaches the dialog
  "cast-crew": SQUARE_ASPECT,
  actors: SQUARE_ASPECT,
  // optimize.ts pads these (fit: "contain") instead of cutting, so a frame
  // here would introduce the damage rather than prevent it.
  avatars: null,
  partners: null,
};

describe("cropAspectForDir", () => {
  for (const [dir, aspect] of Object.entries(DIRS)) {
    it(`${dir} → ${aspect ?? "no dialog"}`, () => {
      expect(cropAspectForDir(dir)).toBe(aspect);
    });
  }

  it("classifies by substring, so nested member dirs land the same way", () => {
    expect(cropAspectForDir("members/12/projects")).toBe(WIDE_ASPECT);
    expect(cropAspectForDir("members/12/avatars")).toBeNull();
  });
});

/** IA-62: the form refuses a source smaller than what optimize.ts would
 *  produce, because that branch never upscales — a 640×360 poster is stored
 *  at 640×360 and reads as blurry on the catalog card. Bigger is fine: the
 *  crop dialog frames it and the server scales it down. */
describe("imageBelowRequired", () => {
  it("refuses a poster/still under 1600×900 and accepts anything at or above it", () => {
    expect(imageBelowRequired({ w: 640, h: 360 }, "projects")).toBe(true);
    expect(imageBelowRequired({ w: 1600, h: 900 }, "projects")).toBe(false);
    expect(imageBelowRequired({ w: 4000, h: 2250 }, "projects")).toBe(false);
  });

  it("holds a cast photo to 800×800", () => {
    expect(imageBelowRequired({ w: 500, h: 500 }, "cast-crew")).toBe(true);
    expect(imageBelowRequired({ w: 800, h: 800 }, "actors")).toBe(false);
  });

  it("catches a wide-but-short source, not just a small one", () => {
    // 16:9 cropping takes pixels away; 2000×400 has the width but not the
    // height, and `cover` would blow it up to reach 900.
    expect(imageBelowRequired({ w: 2000, h: 400 }, "projects")).toBe(true);
  });

  it("names the size the warning shows", () => {
    expect(formatRequiredSize("projects")).toBe("1600×900");
    expect(formatRequiredSize("cast-crew")).toBe("800×800");
  });
});
