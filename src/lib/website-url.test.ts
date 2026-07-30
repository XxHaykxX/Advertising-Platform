import { describe, it, expect } from "vitest";
import { parseWebsiteUrl } from "@/lib/website-url";

/* IA-35 — the brand profile's website field. Chrome's own `type="url"`
   checkValidity() waves `\\example.com` and `https:\\example.com` through
   unfixed (a URL parser folds backslash into slash for special schemes once
   it actually parses the string, but checkValidity() doesn't rewrite what it
   validates) and rejects a bare `example.com` outright — so this is checked
   again here, server-side, on the value that actually reaches the column. */

describe("parseWebsiteUrl", () => {
  it("accepts empty as valid — the field is optional", () => {
    expect(parseWebsiteUrl("")).toEqual({ ok: true, value: null });
    expect(parseWebsiteUrl("   ")).toEqual({ ok: true, value: null });
  });

  it("adds https:// to a bare domain", () => {
    expect(parseWebsiteUrl("example.com")).toEqual({
      ok: true,
      value: "https://example.com/",
    });
  });

  it("normalises the backslash form the browser lets through unfixed", () => {
    expect(parseWebsiteUrl("\\\\example.com")).toEqual({
      ok: true,
      value: "https://example.com/",
    });
  });

  it("normalises a backslash'd scheme to https://", () => {
    expect(parseWebsiteUrl("https:\\\\example.com")).toEqual({
      ok: true,
      value: "https://example.com/",
    });
  });

  it("rejects javascript: rather than coercing it — this value is rendered as a link", () => {
    expect(parseWebsiteUrl("javascript:alert(1)")).toEqual({ ok: false });
  });

  it("accepts a normal https URL unchanged", () => {
    expect(parseWebsiteUrl("https://example.com")).toEqual({
      ok: true,
      value: "https://example.com/",
    });
  });

  it("keeps a path and query string intact", () => {
    expect(parseWebsiteUrl("https://example.com/brand?ref=igovazd")).toEqual({
      ok: true,
      value: "https://example.com/brand?ref=igovazd",
    });
  });

  it("rejects other schemes too (only http/https may be stored)", () => {
    expect(parseWebsiteUrl("ftp://example.com")).toEqual({ ok: false });
  });
});
