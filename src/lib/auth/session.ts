import { SignJWT, jwtVerify } from "jose";

/* Stateless admin session: a signed JWT stored in an httpOnly cookie.
   Edge-safe (jose) so it can be verified in middleware. */

export const SESSION_COOKIE = "adm_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET is missing or too short (>= 16 chars).");
  }
  return new TextEncoder().encode(s);
}

/** Create a signed session token for the single admin. */
export async function createSessionToken(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

/** Returns true if the token is a valid, unexpired admin session. */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.admin === true;
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
