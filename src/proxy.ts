import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { isMemberReachablePath } from "@/lib/auth/member-paths";

const STAFF_ROLES = ["SUPERADMIN", "PUBLISHER", "MODERATOR", "TRANSLATOR"];

/* Two guards, both driven off the (signature + expiry only) session token — the
   authoritative isActive/role/status checks live server-side in
   requireUser()/requireMember():
     1. /admin — staff only; members and anonymous users get the login page.
     2. Members (BRAND / CREATOR) are confined to their cabinet: any attempt to
        reach the public site or the auth pages is bounced back to /account
        (creator) or /account/brand (brand), even by editing the URL directly.
        The catalog, contact and legal pages are the exception (see below). */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  const isStaff = session !== null && STAFF_ROLES.includes(session.role);
  const isMember = session !== null && (session.role === "BRAND" || session.role === "CREATOR");

  // --- 1. Admin area (staff only) ---
  if (pathname.startsWith("/admin")) {
    const isLogin = pathname === "/admin/login";
    if (!isStaff && !isLogin) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    if (isStaff && isLogin) {
      const url = req.nextUrl.clone();
      // A TRANSLATOR can only reach the dictionary editor — every other admin
      // page 404s for that role, so land them there instead of the dashboard.
      url.pathname = session!.role === "TRANSLATOR" ? "/admin/i18n" : "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // --- 2. Members are locked to their own cabinet ---
  // (plus /reports/[id] — the media detail page both cabinets link to from
  // dashboard/interests/favorites/browse/creator-projects, IA-18/IA-19 — and,
  // as of audit 4.1 / owner decision C.4, the public catalog + legal/contact
  // pages. Everything else public (the landing page, /login, /register, ...)
  // stays off-limits so a signed-in member can't wander into guest-only
  // flows. See lib/auth/member-paths.ts for the shared allow-list, also used
  // by the login action to validate a post-login ?from= redirect target.)
  if (isMember) {
    if (!isMemberReachablePath(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = session!.role === "BRAND" ? "/account/brand" : "/account";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Run on every page request except Next internals, API routes, uploaded/served
// files and anything with a file extension (assets). Broad enough to catch the
// public site so the member confinement above can fire on "/" and friends.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|uploads|.*\\.).*)"],
};
