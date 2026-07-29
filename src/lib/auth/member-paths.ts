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

/** Audit 4.3: a guest bounced to /login while looking at, say, a catalog
   listing used to always land back in the cabinet after signing in, losing
   their place. Only accept a same-origin, path-only ?from= — no protocol-
   relative ("//evil.com") or backslash tricks that some browsers still treat
   as a host separator, and no "..", which the browser normalises away and
   which would otherwise walk out of the allow-list ("/reports/../admin/i18n")
   — and only if a signed-in member could actually reach it (same allow-list
   the proxy confinement enforces), so this can't be used to redirect into
   /admin or another guest-only flow.

   Shared by the login and register actions: since 2026-07-29 a guest who
   clicks Apply on an offer card carries `?from=/reports/34?offer=P:5` all the
   way through sign-up, not just sign-in. */
export function safeMemberRedirect(from: string | null): string | null {
  if (!from) return null;
  if (!from.startsWith("/") || from.startsWith("//") || from.includes("\\")) return null;
  if (from.includes("..")) return null;
  return isMemberReachablePath(from) ? from : null;
}
