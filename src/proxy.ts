import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

const STAFF_ROLES = ["SUPERADMIN", "PUBLISHER", "MODERATOR"];

/* Two guards, both driven off the (signature + expiry only) session token — the
   authoritative isActive/role/status checks live server-side in
   requireUser()/requireMember():
     1. /admin — staff only; members and anonymous users get the login page.
     2. Members (BRAND / CREATOR) are confined to their cabinet: any attempt to
        reach the public site or the auth pages is bounced back to /account
        (creator) or /account/brand (brand), even by editing the URL directly. */
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
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // --- 2. Members are locked to their own cabinet ---
  if (isMember) {
    const inCabinet = pathname === "/account" || pathname.startsWith("/account/");
    // /reports/[id] is the media detail page both cabinets link to (dashboard
    // interests, favorites, browse, creator projects) — it must stay reachable
    // for members (IA-18/IA-19: confinement bounced these links back to the
    // dashboard, so detail pages silently never opened).
    const isReport = pathname === "/reports" || pathname.startsWith("/reports/");
    if (!inCabinet && !isReport) {
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
