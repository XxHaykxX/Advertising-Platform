"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";
import {
  verifyUserPassword,
  verifyUserPasswordById,
  setUserPassword,
} from "@/lib/auth/password";
import { requireSuperadmin } from "@/lib/auth/require";

export type ActionState = { error?: string; ok?: boolean };

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
  const ip = await clientIp();
  if (rateLimited(ip)) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Please enter your email and password." };

  const user = await verifyUserPassword(email, password);
  if (!user) {
    recordFailure(ip);
    return { error: "Incorrect email or password." };
  }

  attempts.delete(ip);
  const token = await createSessionToken(user.id, user.role);
  const c = await cookies();
  c.set(SESSION_COOKIE, token, sessionCookieOptions);

  const from = String(formData.get("from") || "");
  redirect(from && from.startsWith("/admin") ? from : "/admin");
}

export async function logout() {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
  redirect("/admin/login");
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
