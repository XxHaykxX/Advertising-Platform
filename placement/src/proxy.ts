import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/* Protect the admin area. Everything under /admin requires a valid session,
   except the login page itself. */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/admin/login";

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  // Signature + expiry check only (no DB access here).
  // The authoritative isActive gate is enforced by requireUser() server-side.
  const session = await verifySessionToken(token);
  const authed = session !== null;

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
