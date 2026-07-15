import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { googleConfigured, googleAuthUrl, G_STATE_COOKIE } from "@/lib/auth/google";

/** Kick off Google OAuth: set a CSRF state cookie and redirect to Google. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google", url.origin));
  }
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const state = crypto.randomUUID();

  const c = await cookies();
  c.set(G_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(googleAuthUrl(redirectUri, state));
}
