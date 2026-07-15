import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/* Protect the admin area. Everything under /admin requires a valid session,
   except the login page itself. */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/admin/login";

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  // Signature + expiry check only (no DB access here).
  // The authoritative isActive/role gate is enforced by requireUser() server-side.
  // Only STAFF sessions count as "authed" for /admin — a member (BRAND/CREATOR)
  // token is treated as unauthenticated here, so it is shown the login page
  // instead of being bounced into an infinite redirect against requireUser().
  const session = await verifySessionToken(token);
  const authed =
    session !== null && (session.role === "SUPERADMIN" || session.role === "PUBLISHER");

  if (!authed && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Already logged in → bounce away from the login page.
  if (authed && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
