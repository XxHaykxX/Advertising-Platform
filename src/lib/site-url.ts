/** The origin the site is reachable at from the outside.
 *
 *  Read from configuration and never from the incoming request. Behind a proxy
 *  — Passenger today, an Application Load Balancer after the AWS move —
 *  `new URL(req.url).origin` is the app's own bind address, not the address the
 *  browser typed. That is IA-31, written up at length in
 *  api/auth/signout/route.ts, and a forwarded-host header is no fix because it
 *  is attacker-suppliable.
 *
 *  Anywhere a *relative* URL will do, use one — it has no origin to get wrong.
 *  This helper is for the few places that must hand an absolute origin to
 *  something outside the app: an OAuth redirect_uri, a link inside an email. */
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://igovazd.am";
}
