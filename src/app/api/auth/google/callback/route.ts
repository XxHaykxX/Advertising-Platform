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
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth/session";

const bounce = (origin: string, path: string) => NextResponse.redirect(new URL(path, origin));

/** Google OAuth callback: verify state, exchange the code, then either sign an
   existing approved member in, or hand a new user to /register/complete to
   choose an account type. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const c = await cookies();
  const savedState = c.get(G_STATE_COOKIE)?.value;
  c.delete(G_STATE_COOKIE);

  if (!code || !state || !savedState || state !== savedState) {
    return bounce(origin, "/login?error=google");
  }

  const redirectUri = `${origin}/api/auth/google/callback`;
  const profile = await exchangeAndFetchProfile(code, redirectUri);
  if (!profile || !profile.emailVerified) {
    return bounce(origin, "/login?error=google");
  }

  // Existing account? Match by googleId first, then by verified email.
  const byGoogle = await findMemberByGoogleId(profile.sub);
  const existing =
    byGoogle ?? (await prisma.user.findUnique({ where: { email: profile.email.toLowerCase() } }));

  if (existing) {
    // Staff accounts must sign in via /admin/login, never via the member OAuth.
    if (existing.role !== "BRAND" && existing.role !== "CREATOR") {
      return bounce(origin, "/login?error=google");
    }
    if (existing.status === "BLOCKED" || !existing.isActive) return bounce(origin, "/login?status=blocked");
    if (existing.status === "REJECTED") return bounce(origin, "/login?status=rejected");
    if (existing.status !== "APPROVED") return bounce(origin, "/login?status=pending");

    // Link the Google id to a pre-existing email/password member on first use.
    if (!existing.googleId) {
      await prisma.user.update({ where: { id: existing.id }, data: { googleId: profile.sub } });
    }
    const token = await createSessionToken(existing.id, existing.role);
    const res = bounce(origin, "/account");
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  }

  // New user: carry the verified profile to the profile-completion step.
  const pending = await signPendingGoogle({ sub: profile.sub, email: profile.email, name: profile.name });
  const res = bounce(origin, "/register/complete");
  res.cookies.set(G_PENDING_COOKIE, pending, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 900,
  });
  return res;
}
