import { describe, it, expect } from "vitest";
import {
  safeSegment,
  isSafeKey,
  publicPathToKey,
  keyToPublicPath,
  contentTypeForKey,
  contentDispositionForKey,
} from "./keys";

describe("safeSegment", () => {
  it("keeps ordinary folder names, dots included", () => {
    expect(safeSegment("projects")).toBe("projects");
    expect(safeSegment("v1.2")).toBe("v1.2");
    expect(safeSegment("a_b-c")).toBe("a_b-c");
  });

  it("collapses a dots-only segment — the traversal that survived the filter", () => {
    expect(safeSegment("..")).toBe("misc");
    expect(safeSegment(".")).toBe("misc");
    expect(safeSegment("....")).toBe("misc");
  });

  it("strips separators rather than passing them through", () => {
    expect(safeSegment("a/b")).toBe("ab");
    expect(safeSegment("a\\b")).toBe("ab");
    // "../../etc" keeps its dots but loses every separator, so what comes out
    // is the odd-but-harmless folder name "....etc" — it cannot climb, because
    // climbing needs a separator and there is none left. The dots-only case
    // above is the one that has to collapse; this one does not.
    expect(safeSegment("../../etc")).toBe("....etc");
    expect(safeSegment("../../etc")).not.toContain("/");
  });

  it("falls back when nothing survives, and caps the length", () => {
    expect(safeSegment("")).toBe("misc");
    expect(safeSegment("!!!")).toBe("misc");
    expect(safeSegment("x".repeat(200))).toHaveLength(64);
  });
});

describe("isSafeKey", () => {
  it("accepts plain relative keys", () => {
    expect(isSafeKey("videos/a.mp4")).toBe(true);
    expect(isSafeKey("members/12/avatars/b.webp")).toBe(true);
  });

  it("rejects every way out of the root", () => {
    expect(isSafeKey("../secret")).toBe(false);
    expect(isSafeKey("videos/../../secret")).toBe(false);
    expect(isSafeKey("/absolute")).toBe(false);
    expect(isSafeKey("videos/./a.mp4")).toBe(false);
    expect(isSafeKey("videos//a.mp4")).toBe(false);
    expect(isSafeKey("videos\\a.mp4")).toBe(false);
    expect(isSafeKey("videos/a\0.mp4")).toBe(false);
    expect(isSafeKey("")).toBe(false);
  });
});

describe("publicPathToKey", () => {
  it("round-trips a real path", () => {
    expect(publicPathToKey("/uploads/videos/a.mp4")).toBe("videos/a.mp4");
    expect(keyToPublicPath("videos/a.mp4")).toBe("/uploads/videos/a.mp4");
  });

  it("refuses anything that is not inside the uploads tree", () => {
    expect(publicPathToKey("/etc/passwd")).toBeNull();
    expect(publicPathToKey("https://evil.example/x.jpg")).toBeNull();
    expect(publicPathToKey("/uploads/")).toBeNull();
    expect(publicPathToKey("/uploads/../secret")).toBeNull();
    expect(publicPathToKey("")).toBeNull();
  });
});

describe("content type", () => {
  it("maps the extensions the app actually stores", () => {
    expect(contentTypeForKey("a/b.mp4")).toBe("video/mp4");
    expect(contentTypeForKey("a/b.JPG")).toBe("image/jpeg");
    expect(contentTypeForKey("a/b.pdf")).toBe("application/pdf");
  });

  it("falls back rather than guessing", () => {
    expect(contentTypeForKey("a/b.exe")).toBe("application/octet-stream");
    expect(contentTypeForKey("noextension")).toBe("application/octet-stream");
  });

  it("forces the attachment disposition for PDFs only", () => {
    expect(contentDispositionForKey("decks/a.pdf")).toBe("attachment");
    expect(contentDispositionForKey("posters/a.webp")).toBeUndefined();
  });
});
