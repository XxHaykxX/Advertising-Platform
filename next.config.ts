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
    // Server Actions cap request bodies at 1 MB by default; uploads (uploadImage)
    // need headroom. Must clear the LARGEST per-file cap in uploads.ts —
    // MAX_BYTES_VIDEO = 50 MB (trailer .mp4/.webm). At 8mb every video >8 MB was
    // silently rejected by the framework before uploadImage even ran (that was
    // the "mp4 upload doesn't work" bug). 52mb leaves margin for multipart overhead.
    serverActions: {
      bodySizeLimit: "52mb",
    },
  },
};

export default nextConfig;
