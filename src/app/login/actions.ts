"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateMember } from "@/lib/auth/members";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth/session";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export type LoginState = { error?: string };

/* Per-IP throttle mirroring admin login. In-memory, resets on restart —
   acceptable for a single-node shared-hosting MVP. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : h.get("x-real-ip"))?.trim() || "local";
}
function rateLimited(ip: string): boolean {
  const rec = attempts.get(ip);
  return !!rec && rec.resetAt >= Date.now() && rec.count >= MAX_ATTEMPTS;
}
function recordFailure(ip: string) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt < now) attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  else rec.count += 1;
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const locale = await getLocale();
  const t = makeUI(locale);

  const ip = await clientIp();
  if (rateLimited(ip)) return { error: t("login.errInvalid") };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const result = await authenticateMember(email, password);

  if (!result.ok) {
    recordFailure(ip);
    if (result.reason === "pending") return { error: t("login.errPending") };
    if (result.reason === "blocked") return { error: t("login.errBlocked") };
    if (result.reason === "rejected") return { error: t("login.errRejected") };
    return { error: t("login.errInvalid") };
  }

  attempts.delete(ip);

  const token = await createSessionToken(result.user.id, result.user.role);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions());

  redirect("/account");
}
