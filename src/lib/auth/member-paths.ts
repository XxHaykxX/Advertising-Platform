/** Path prefixes a signed-in member (BRAND/CREATOR) may reach outside their
   own cabinet — the public catalog and legal/contact pages (audit 4.1, owner
   decision C.4). Shared by proxy.ts (enforces the member confinement) and
   the login action (validates a post-login ?from= redirect target), so the
   two stay in sync instead of drifting apart. */
export const MEMBER_ALLOWED_PUBLIC_PREFIXES = ["/catalog", "/contact", "/terms", "/privacy", "/how-it-works"];

function hasPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** True when `pathname` is somewhere a signed-in member (either role) may
   land: their own cabinet (/account/**), a report detail page (/reports/**),
   or one of the allow-listed public pages above. Doesn't check role-specific
   sub-paths (e.g. /account/brand/** for a CREATOR) — those are already
   re-validated by each layout's own requireMember() + role check, which
   bounces a mismatched target back to the right cabinet rather than 404ing. */
export function isMemberReachablePath(pathname: string): boolean {
  return (
    hasPrefix(pathname, "/account") ||
    hasPrefix(pathname, "/reports") ||
    MEMBER_ALLOWED_PUBLIC_PREFIXES.some((prefix) => hasPrefix(pathname, prefix))
  );
}
