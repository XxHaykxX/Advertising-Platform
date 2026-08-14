import { describe, expect, it } from "vitest";
import { cropAspectForDir, SQUARE_ASPECT, WIDE_ASPECT } from "./size-hint";

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
