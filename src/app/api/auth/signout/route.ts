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

  const res = NextResponse.redirect(new URL(target, url.origin));
  // Same attributes the cookie was set with (path especially) or the browser
  // keeps the original alongside the expired one.
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return res;
}
