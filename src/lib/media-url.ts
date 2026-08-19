/** Rewrites a stored /uploads/... path to an absolute URL on the media origin.
 *
 *  Why this exists at all: in `s3` storage mode /uploads/[...path]/route.ts
 *  302-redirects to the CDN rather than streaming bytes (see that route and
 *  src/lib/storage/s3-driver.ts). A browser <img>/<video> follows a redirect
 *  fine, but Next's image optimizer fetches a relative `src` through its own
 *  internal handler and does not follow it — /_next/image then 400s. Handing
 *  the optimizer an absolute URL instead makes it fetch over plain HTTP like
 *  any other remote image, which redirects work for.
 *
 *  No `server-only` import: this runs in client components (every `<Image>`/
 *  `<video>` that renders a stored path does), so it can't pull in anything
 *  that throws outside a request. NEXT_PUBLIC_MEDIA_ORIGIN is read directly
 *  rather than through a helper that touches non-public env for the same
 *  reason — it has to be inlinable at build time (see Dockerfile / next.config.ts). */
export function mediaUrl(path: string): string {
  const origin = process.env.NEXT_PUBLIC_MEDIA_ORIGIN;
  if (!origin || !path.startsWith("/uploads/")) return path;
  return `${origin.replace(/\/+$/, "")}${path}`;
}

/** The next.config.ts remotePatterns entry that allow-lists `origin` for the
 *  image optimizer. Must mirror what mediaUrl() actually produces: a bare CDN
 *  host has no path of its own, so `pathname` is just "/uploads/**", but a
 *  path-style S3 endpoint (MinIO's http://host:9100/bucket-name) puts a path
 *  in the origin ITSELF, and the request the optimizer makes is
 *  .../bucket-name/uploads/..., not .../uploads/... — hardcoding "/uploads/**"
 *  silently fails closed for that shape (the exact shape s3 mode uses locally). */
export function mediaOriginRemotePattern(origin: string) {
  const url = new URL(origin);
  return {
    protocol: url.protocol.replace(":", "") as "http" | "https",
    hostname: url.hostname,
    pathname: `${url.pathname.replace(/\/+$/, "")}/uploads/**`,
  };
}
