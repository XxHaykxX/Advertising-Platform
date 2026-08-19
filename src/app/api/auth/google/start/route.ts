import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { googleConfigured, googleAuthUrl, G_STATE_COOKIE } from "@/lib/auth/google";
import { siteUrl } from "@/lib/site-url";

/** A root-relative Location, for the same reason api/auth/signout/route.ts
 *  sends one: there is no origin in it to get wrong behind a proxy. */
const bounce = (path: string) => new NextResponse(null, { status: 307, headers: { Location: path } });

/** Kick off Google OAuth: set a CSRF state cookie and redirect to Google. */
export async function GET() {
  if (!googleConfigured()) return bounce("/login?error=google");

  // The one URL here that cannot be relative — Google receives it and compares
  // it, character for character, with the redirect URI registered on the OAuth
  // client. Built from req.url it would be the container's bind address behind
  // the load balancer, and every sign-in would come back redirect_uri_mismatch.
  const redirectUri = `${siteUrl()}/api/auth/google/callback`;
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
