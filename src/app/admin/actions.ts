"use server";

import { cookies, headers } from "next/headers";
import {
  SESSION_COOKIE,
  LAST_EMAIL_COOKIE,
  REMEMBER_MAX_AGE_SECONDS,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";
import {
  verifyUserPassword,
  verifyUserPasswordById,
  setUserPassword,
} from "@/lib/auth/password";
import { requireSuperadmin } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export type ActionState = {
  error?: string;
  ok?: boolean;
  redirect?: string;
  email?: string;
};

/* ── In-memory login rate limit (per IP). Resets on process restart —
   acceptable for a single-admin MVP on shared hosting. ── */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : h.get("x-real-ip"))?.trim() || "local";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt < now) return false;
  return rec.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    rec.count += 1;
  }
}

export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = makeUI(await getLocale());

  // Parsed up front (before any error branch) so it can be echoed back in
  // every error response below — React 19 resets this uncontrolled input
  // after the action runs, so without the echo a failed submit wipes what
  // the admin typed (see /login for the same pattern).
  const email = String(formData.get("email") || "").trim().toLowerCase();

  const ip = await clientIp();
  if (rateLimited(ip)) {
    return { error: t("login.errTooManyAttempts"), email };
  }

  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: t("login.errFillBoth"), email };

  const result = await verifyUserPassword(email, password);
  if (!result.ok) {
    if (result.reason === "deactivated") {
      return { error: t("login.errDeactivated"), email };
    }
    recordFailure(ip);
    return { error: t("login.errInvalid"), email };
  }

  // Members (BRAND / CREATOR) must never obtain an admin session — they sign in
  // at /login. Reject them here even with correct credentials.
  if (
    result.user.role !== "SUPERADMIN" &&
    result.user.role !== "PUBLISHER" &&
    result.user.role !== "MODERATOR"
  ) {
    recordFailure(ip);
    return { error: t("login.errInvalid"), email };
  }

  attempts.delete(ip);
  const user = result.user;
  const remember = formData.get("remember") != null;
  // Remembered: 30-day persistent cookie. Otherwise: session cookie (dies on browser close).
  const token = await createSessionToken(
    user.id,
    user.role,
    remember ? REMEMBER_MAX_AGE_SECONDS : undefined,
  );
  const c = await cookies();
  c.set(
    SESSION_COOKIE,
    token,
    sessionCookieOptions(remember ? REMEMBER_MAX_AGE_SECONDS : undefined),
  );

  // Prefill email on the next visit if remembered; forget it otherwise.
  if (remember) {
    c.set(LAST_EMAIL_COOKIE, email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REMEMBER_MAX_AGE_SECONDS,
    });
  } else {
    c.delete(LAST_EMAIL_COOKIE);
  }

  const from = String(formData.get("from") || "");
  // Don't redirect() here: this cookie was just set in a useActionState action,
  // and Next 16 would render the destination from the root in the same
  // action response, before the cookie is visible to the auth gate — a
  // nested redirect there crashes the flight tree into global-error. Instead
  // report success and let the client navigate with a fresh full request.
  return { ok: true, redirect: from && from.startsWith("/admin") ? from : "/admin" };
}

/** Doesn't redirect() itself — on Hostinger/Passenger a redirect() inside a
 *  server action crashes the in-flight flight tree (same class of bug as
 *  login above). Instead it reports where to go and LogoutButton navigates
 *  on the client with a fresh full request. */
export async function logout(): Promise<{ ok: true; redirect: string }> {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
  return { ok: true, redirect: "/admin/login" };
}

export async function changePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Settings is super-admin-only; also re-verifies isActive (instant deactivation).
  const user = await requireSuperadmin();

  const current = String(formData.get("current") || "");
  const next = String(formData.get("next") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!current || !next) return { error: "Please fill in all fields." };
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next !== confirm) return { error: "Passwords do not match." };

  const ok = await verifyUserPasswordById(user.id, current);
  if (!ok) return { error: "Current password is incorrect." };

  await setUserPassword(user.id, next);
  return { ok: true };
}
