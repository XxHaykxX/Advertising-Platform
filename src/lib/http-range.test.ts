import { describe, it, expect } from "vitest";
import { parseRange } from "./http-range";

describe("parseRange", () => {
  const SIZE = 1000;

  it("returns null without a header", () => {
    expect(parseRange(null, SIZE)).toBeNull();
    expect(parseRange("", SIZE)).toBeNull();
  });

  it("handles the open-ended range a <video> sends first", () => {
    expect(parseRange("bytes=0-", SIZE)).toEqual([0, 999]);
  });

  it("handles an explicit range", () => {
    expect(parseRange("bytes=100-199", SIZE)).toEqual([100, 199]);
  });

  it("handles a suffix range", () => {
    expect(parseRange("bytes=-500", SIZE)).toEqual([500, 999]);
    // Suffix longer than the file clamps to the whole file.
    expect(parseRange("bytes=-5000", SIZE)).toEqual([0, 999]);
  });

  it("clamps an end past EOF", () => {
    expect(parseRange("bytes=900-9999", SIZE)).toEqual([900, 999]);
  });

  it("rejects unsatisfiable and malformed ranges", () => {
    expect(parseRange("bytes=1000-", SIZE)).toBeNull(); // start at EOF
    expect(parseRange("bytes=500-100", SIZE)).toBeNull(); // inverted
    expect(parseRange("bytes=-", SIZE)).toBeNull();
    expect(parseRange("bytes=abc-def", SIZE)).toBeNull();
    expect(parseRange("items=0-10", SIZE)).toBeNull();
    expect(parseRange("bytes=0-10, 20-30", SIZE)).toBeNull(); // multi-range
  });

  it("tolerates surrounding whitespace", () => {
    expect(parseRange("  bytes=0-99  ", SIZE)).toEqual([0, 99]);
  });

  it("returns null for an empty file", () => {
    expect(parseRange("bytes=0-", 0)).toBeNull();
  });
});
