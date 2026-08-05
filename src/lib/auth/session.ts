import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

/* Stateless session: a signed JWT stored in an httpOnly cookie, carrying the
   user id + role. Edge-safe (jose) so it can be verified in middleware.
   NOTE: this only proves the token is a validly-signed, unexpired session for
   that uid — it does NOT confirm the user is still active. The authoritative
   isActive gate lives in requireUser() (Node runtime, hits the DB). */

/* Two session cookies, one per audience (IA-47). A browser holds one value per
   cookie name, so while staff and members shared a single name, signing into
   the member cabinet silently overwrote an open admin session and vice versa —
   different email addresses didn't help, since the collision is on the cookie,
   not on the role. Same token format and the same signing secret for both;
   only the name differs, and each guard reads exactly one of them. There is
   deliberately no "either cookie" fallback and no default name: every call site
   has to say which audience it means. */

/** Staff session: SUPERADMIN / PUBLISHER / MODERATOR / TRANSLATOR, set at
   /admin/login. Keeps the historical name, so this split logs no staff out. */
export const STAFF_SESSION_COOKIE = "adm_session";
/** Member session: BRAND / CREATOR, set at /login, /register and the Google
   callback. A new name, so the release signs every member out once. */
export const MEMBER_SESSION_COOKIE = "mbr_session";
/** Non-httpOnly cookie holding the last logged-in email, for "Remember me" prefill. */
export const LAST_EMAIL_COOKIE = "adm_last_email";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days (default / not remembered)
export const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days ("Remember me")

export type SessionPayload = { uid: number; role: Role };

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET is missing or too short (>= 16 chars).");
  }
  return new TextEncoder().encode(s);
}

/** Create a signed session token for a logged-in user. */
export async function createSessionToken(
  uid: number,
  role: Role,
  maxAgeSeconds: number = MAX_AGE_SECONDS,
): Promise<string> {
  return new SignJWT({ uid, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(secret());
}

/** Verifies signature + expiry only (edge-safe, no DB access). Returns the
   decoded { uid, role } payload, or null if missing/invalid/expired. */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.uid !== "number" || typeof payload.role !== "string") {
      return null;
    }
    return { uid: payload.uid, role: payload.role as Role };
  } catch {
    return null;
  }
}

/** Cookie options for the session. Called with no argument → persist with the
   default 7-day maxAge. Called with an explicit `undefined` → omit maxAge, i.e.
   a session cookie that dies when the browser closes (admin "remember me"
   unchecked). Branch on `arguments.length` because a plain default parameter
   can't distinguish "not passed" from "passed undefined" — both would fire the
   default and wrongly persist the cookie. */
export function sessionCookieOptions(maxAgeSeconds?: number) {
  const effective = arguments.length > 0 ? maxAgeSeconds : MAX_AGE_SECONDS;
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(effective !== undefined ? { maxAge: effective } : {}),
  };
}
