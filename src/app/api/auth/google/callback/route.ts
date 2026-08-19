import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  exchangeAndFetchProfile,
  signPendingGoogle,
  G_STATE_COOKIE,
  G_PENDING_COOKIE,
} from "@/lib/auth/google";
import { findMemberByGoogleId } from "@/lib/auth/members";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";
import {
  MEMBER_SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";

/** A root-relative Location, for the same reason api/auth/signout/route.ts
 *  sends one: there is no origin in it to get wrong behind a proxy. */
const bounce = (path: string) => new NextResponse(null, { status: 307, headers: { Location: path } });

/** Google OAuth callback: verify state, exchange the code, then either sign an
   existing approved member in, or hand a new user to /register/complete to
   choose an account type. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const c = await cookies();
  const savedState = c.get(G_STATE_COOKIE)?.value;
  c.delete(G_STATE_COOKIE);

  if (!code || !state || !savedState || state !== savedState) {
    return bounce("/login?error=google");
  }

  // Must be byte-identical to the one /api/auth/google/start sent, and to the
  // one registered on the OAuth client — so it comes from configuration, not
  // from req.url, which behind the load balancer is the container's own
  // address (IA-31).
  const redirectUri = `${siteUrl()}/api/auth/google/callback`;
  const profile = await exchangeAndFetchProfile(code, redirectUri);
  if (!profile || !profile.emailVerified) {
    return bounce("/login?error=google");
  }

  // Existing account? Match by googleId first, then by verified email.
  const byGoogle = await findMemberByGoogleId(profile.sub);
  const existing =
    byGoogle ?? (await prisma.user.findUnique({ where: { email: profile.email.toLowerCase() } }));

  if (existing) {
    // Staff accounts must sign in via /admin/login, never via the member OAuth.
    if (existing.role !== "BRAND" && existing.role !== "CREATOR") {
      return bounce("/login?error=google");
    }
    if (existing.status === "BLOCKED" || !existing.isActive) return bounce("/login?status=blocked");
    if (existing.status === "REJECTED") return bounce("/login?status=rejected");
    if (existing.status !== "APPROVED") return bounce("/login?status=pending");

    // Link the Google id to a pre-existing email/password member on first use.
    if (!existing.googleId) {
      await prisma.user.update({ where: { id: existing.id }, data: { googleId: profile.sub } });
    }
    const token = await createSessionToken(existing.id, existing.role);
    const res = bounce("/account");
    // Google sign-in is the member flow only (staff accounts were bounced
    // above), so it writes the member cookie.
    res.cookies.set(MEMBER_SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  }

  // New user: carry the verified profile to the profile-completion step.
  const pending = await signPendingGoogle({ sub: profile.sub, email: profile.email, name: profile.name });
  const res = bounce("/register/complete");
  res.cookies.set(G_PENDING_COOKIE, pending, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 900,
  });
  return res;
}
