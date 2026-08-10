import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only route indicator, default `bottom-left` — sat over the catalog's
  // "Показано N проектов" counter on mobile (QA-4). Moved rather than padded:
  // the indicator is fixed on every route, so a page-local fix would only
  // patch /catalog and leave the same overlap on the next page that happens
  // to put content in that corner. `top-left` is clear of the two other fixed
  // widgets in the app (push-subscribe: bottom-right, notification-toaster:
  // top-right).
  devIndicators: {
    position: "top-left",
  },
  // No `output: standalone` — Hostinger's managed Next runner serves the app with
  // `next start` (which errors out against a standalone build). It keeps
  // node_modules + .next around at runtime, so plain `next start` is what works.
  // Poster/gallery/headshots are uploaded in the panel and served from
  // /uploads. The optimizer was off (`unoptimized: true`) until 2026-07-31 —
  // which meant every `sizes` prop in the app did nothing and a 24px cast
  // thumbnail downloaded the full-size original. Perf audit measured ~300 KB of
  // needlessly large images per page, so it is on now, with the blast radius
  // kept small:
  //   * no `remotePatterns` → only same-origin paths can be optimized, so the
  //     SSRF surface the old comment worried about stays closed;
  //   * `/uploads/**` lives outside public_html on prod and is served by the
  //     Node route in src/app/uploads/[...path]/route.ts — the optimizer reaches
  //     it through Next's *internal* request handler (fetchInternalImage, no
  //     socket), so nothing depends on the app being able to call its own
  //     public URL behind Passenger;
  //   * one format (WebP, not AVIF) and one quality — AVIF encodes several times
  //     slower, and this is shared hosting with a small CPU budget;
  //   * a trimmed size ladder, so a poster is encoded a handful of times, not
  //     once per breakpoint in the default list;
  //   * 31-day TTL on `.next/cache/images`, because uploads are content-hashed
  //     names that never change in place.
  // SVG is passed through untouched by Next itself (flags/ is 271 SVGs).
  images: {
    formats: ["image/webp"],
    qualities: [75],
    deviceSizes: [640, 828, 1080, 1920],
    imageSizes: [32, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2678400,
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
