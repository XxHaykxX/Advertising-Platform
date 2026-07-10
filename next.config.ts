import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No `output: standalone` — Hostinger's managed Next runner serves the app with
  // `next start` (which errors out against a standalone build). It keeps
  // node_modules + .next around at runtime, so plain `next start` is what works.
  // Poster/gallery/headshots are uploaded in the panel and served from
  // /uploads. `unoptimized` sends the file straight to the browser <img> — no
  // server-side fetch/optimizer, so nothing can hang the Node server and
  // there's no image-optimizer SSRF surface.
  images: {
    unoptimized: true,
  },
  experimental: {
    // Server Actions cap request bodies at 1 MB by default; image uploads
    // (uploadImage) need headroom. Matches the 8 MB per-file cap enforced in
    // src/lib/actions/uploads.ts.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
