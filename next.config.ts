import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained build (.next/standalone/server.js) for Node hosting on Hostinger.
  output: "standalone",
  // Admins paste arbitrary poster/gallery image URLs in the panel. Without an
  // images config, next/image throws "hostname not configured" and 500s the
  // public report page. `unoptimized` serves the URL straight to the browser
  // <img> — no server-side fetch, so an unreachable/slow host can't hang the
  // Node server, and there's no image-optimizer SSRF surface.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
