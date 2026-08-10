/* The public ad-space card lives at /ads/<channel>/<code>, and `AdSpace.code`
   is "#AS-2026-0417" — the same shape as `Project.code`, hash included.

   A "#" cannot go into a path segment as-is: the browser reads it as the start
   of the fragment and /ads/billboard/#AS-2026-0417 arrives at the server as
   /ads/billboard/. Percent-encoding it works (%23AS-2026-0417) but puts an
   escape into every link the section shares, so the segment carries the code
   WITHOUT its leading hash and the page puts it back before the lookup.

   Both halves live here rather than inline at the two call sites so the
   encode and the decode can never drift apart. */

/** URL segment for a code — the card grid and every link build it with this. */
export function adSpaceSlug(code: string): string {
  return encodeURIComponent(code.replace(/^#/, ""));
}

/** The stored code behind a `[code]` route param (Next already decoded it).
 *  Tolerates a hash that survived the trip, so a hand-typed %23 link still
 *  resolves instead of looking up "##AS-…". */
export function adSpaceCodeFromSlug(slug: string): string {
  return `#${slug.replace(/^#/, "")}`;
}

/** Full path to a space's public card. */
export function adSpacePath(channelSlug: string, code: string): string {
  return `/ads/${channelSlug}/${adSpaceSlug(code)}`;
}
