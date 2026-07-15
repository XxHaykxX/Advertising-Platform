import "server-only";
import { SignJWT, jwtVerify } from "jose";

/* Minimal Google OAuth 2.0 (authorization-code) helpers — no external auth
   library. Reads GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET from the environment;
   when they are absent the feature is simply disabled (googleConfigured()). */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export type GoogleProfile = { sub: string; email: string; name: string; emailVerified: boolean };

/** Exchange the auth code for tokens and fetch the OpenID userinfo. Returns null
   on any failure (bad code, network, missing fields). */
export async function exchangeAndFetchProfile(
  code: string,
  redirectUri: string,
): Promise<GoogleProfile | null> {
  const tokRes = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokRes.ok) return null;
  const tok = (await tokRes.json()) as { access_token?: string };
  if (!tok.access_token) return null;

  const uiRes = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${tok.access_token}` },
  });
  if (!uiRes.ok) return null;
  const ui = (await uiRes.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    email_verified?: boolean;
  };
  if (!ui.sub || !ui.email) return null;
  return {
    sub: ui.sub,
    email: ui.email,
    name: ui.name || ui.email,
    emailVerified: Boolean(ui.email_verified),
  };
}

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET is missing or too short.");
  return new TextEncoder().encode(s);
}

export type PendingGoogle = { sub: string; email: string; name: string };

/** Short-lived signed token carrying a verified Google profile from the callback
   to the /register/complete step (held in the httpOnly `g_pending` cookie). */
export async function signPendingGoogle(p: PendingGoogle): Promise<string> {
  return new SignJWT({ sub: p.sub, email: p.email, name: p.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret());
}

export async function verifyPendingGoogle(token: string | undefined | null): Promise<PendingGoogle | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { sub: payload.sub, email: payload.email, name: String(payload.name ?? payload.email) };
  } catch {
    return null;
  }
}

export const G_STATE_COOKIE = "g_state";
export const G_PENDING_COOKIE = "g_pending";
