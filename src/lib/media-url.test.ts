import { afterEach, describe, expect, it } from "vitest";
import { mediaOriginRemotePattern, mediaUrl } from "./media-url";

describe("mediaUrl", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_MEDIA_ORIGIN;
  });

  it("leaves the path unchanged when the origin is unset", () => {
    expect(mediaUrl("/uploads/posters/x.webp")).toBe("/uploads/posters/x.webp");
  });

  it("prefixes an uploads path with the origin when set", () => {
    process.env.NEXT_PUBLIC_MEDIA_ORIGIN = "https://cdn.igovazd.am";
    expect(mediaUrl("/uploads/posters/x.webp")).toBe("https://cdn.igovazd.am/uploads/posters/x.webp");
  });

  it("leaves an absolute or data URL untouched even with the origin set", () => {
    process.env.NEXT_PUBLIC_MEDIA_ORIGIN = "https://cdn.igovazd.am";
    expect(mediaUrl("https://example.com/x.png")).toBe("https://example.com/x.png");
    expect(mediaUrl("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
  });
});

describe("mediaOriginRemotePattern", () => {
  it("is just /uploads/** for a bare CDN host", () => {
    expect(mediaOriginRemotePattern("https://cdn.igovazd.am")).toEqual({
      protocol: "https",
      hostname: "cdn.igovazd.am",
      pathname: "/uploads/**",
    });
  });

  it("drops the trailing slash rather than doubling it", () => {
    expect(mediaOriginRemotePattern("https://cdn.igovazd.am/")).toEqual({
      protocol: "https",
      hostname: "cdn.igovazd.am",
      pathname: "/uploads/**",
    });
  });

  it("keeps the bucket path for a path-style S3 endpoint (MinIO)", () => {
    expect(mediaOriginRemotePattern("http://127.0.0.1:9100/igovazd-uploads")).toEqual({
      protocol: "http",
      hostname: "127.0.0.1",
      pathname: "/igovazd-uploads/uploads/**",
    });
  });
});
