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
    // The REAL mp4-upload blocker (found 2026-07-26 by uploading 10/12/14 MB
    // clips locally): because this app has a proxy (src/proxy.ts), Next clones
    // and buffers every request body, capped at 10 MB by default. Past that the
    // body is silently TRUNCATED, so the multipart parser inside the upload
    // action died with "Unexpected end of form" → 500, and the picker showed
    // nothing at all. serverActions.bodySizeLimit above is necessary but not
    // sufficient — both caps must clear MAX_BYTES_VIDEO (50 MB) in
    // src/lib/actions/uploads.ts. Cost: a 50 MB upload is buffered in memory,
    // hence the deliberately tight per-file cap on the action side.
    proxyClientMaxBodySize: "52mb",
  },
};

export default nextConfig;
