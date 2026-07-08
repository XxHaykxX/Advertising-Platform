import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No `output: standalone` — Hostinger's managed Next runner serves the app with
  // `next start` (which errors out against a standalone build). It keeps
  // node_modules + .next around at runtime, so plain `next start` is what works.
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
