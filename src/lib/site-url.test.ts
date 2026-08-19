import { describe, it, expect, afterEach } from "vitest";
import { siteUrl } from "@/lib/site-url";

const original = process.env.NEXT_PUBLIC_SITE_URL;
afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = original;
});

describe("siteUrl", () => {
  it("uses the configured origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://staging.igovazd.am";
    expect(siteUrl()).toBe("https://staging.igovazd.am");
  });

  it("falls back to the live domain when unset", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(siteUrl()).toBe("https://igovazd.am");
  });
});
