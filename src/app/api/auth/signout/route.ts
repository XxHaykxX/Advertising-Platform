import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

/** Clears the session cookie and sends the visitor to a login page.
 *
 *  This exists because a session that is *valid but no longer usable* — a
 *  member who was blocked or deleted while signed in, a staff account
 *  deactivated mid-session — used to deadlock the browser with
 *  ERR_TOO_MANY_REDIRECTS: requireMember() finds no usable user and redirects
 *  to /login, the cookie is still there and still validly signed, so proxy.ts
 *  reads it as "a member" and bounces back into the cabinet, which calls
 *  requireMember() again. The same loop exists on the staff side between
 *  requireUser() and /admin/login. Only removing the cookie breaks it, and a
 *  route handler is the one place that can: server components may read cookies
 *  but not write them.
 *
 *  proxy.ts's matcher already excludes /api, so this route is never itself
 *  caught by the confinement it is undoing. */

/** Where a signout may land. A closed list rather than a free `to` parameter:
 *  the URL is reachable by anyone, and an open one would make it an
 *  off-site redirector. */
const TARGETS: Record<string, string> = {
  member: "/login",
  staff: "/admin/login",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = TARGETS[url.searchParams.get("to") ?? "member"] ?? TARGETS.member;

  // NextResponse.redirect() insists on an absolute URL (it runs `new URL()`
  // on whatever you give it with no base, so a bare path throws). Building
  // that absolute URL from req.url/req.nextUrl is exactly the trap IA-31 hit:
  // behind Hostinger's Passenger proxy, req.url reports the app's internal
  // bind address, so `new URL(target, url.origin)` produced
  // http://0.0.0.0:3000/login — a URL only the server can reach, which the
  // browser rejects with ERR_ADDRESS_INVALID. A forwarded-host header would
  // fix that, but it's attacker-suppliable, and TARGETS is already a closed
  // list so there's nothing to gain from trusting it here.
  //
  // A root-relative `Location` header sidesteps all of that: it has no
  // scheme or host, so there is no origin to get wrong. It's legal per RFC
  // 7231 §7.1.2, and every browser resolves it against whatever origin it
  // actually connected to. Building the response by hand (instead of via
  // NextResponse.redirect) is what lets us send a relative Location.
  const res = new NextResponse(null, {
    status: 307,
    headers: { Location: target },
  });
  // Same attributes the cookie was set with (path especially) or the browser
  // keeps the original alongside the expired one.
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return res;
}
