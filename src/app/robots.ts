import type { MetadataRoute } from "next";

/**
 * Site-wide crawl block. The whole site stays un-indexed until the owner
 * explicitly asks to open it up. To go public: switch to `allow: "/"` here and
 * drop the `robots: { index: false }` line in app/layout.tsx metadata.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
