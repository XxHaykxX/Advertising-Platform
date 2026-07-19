"use server";

import { headers } from "next/headers";
import { createPasswordResetToken, redeemPasswordResetToken } from "@/lib/auth/password-reset";
import { sendPasswordResetEmail, siteUrl } from "@/lib/mail";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export type ForgotState = { ok?: boolean; error?: string; email?: string };

/* Per-IP throttle, same shape as /login/actions.ts — this endpoint sends
   email, so it doubles as basic abuse protection against mail-bombing an
   address. In-memory, resets on restart. */
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
function recordAttempt(ip: string) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt < now) attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  else rec.count += 1;
}

/** Always returns {ok:true} once past the throttle — never reveals whether
   the email exists or has a password set (Google-only accounts). */
export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const locale = await getLocale();
  const t = makeUI(locale);

  const ip = await clientIp();
  if (rateLimited(ip)) return { ok: true };
  recordAttempt(ip);

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: t("register.errFields"), email };

  const rawToken = await createPasswordResetToken(email);
  if (rawToken) {
    const resetUrl = `${siteUrl()}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(email, resetUrl);
  }

  return { ok: true };
}

export type ResetState = { ok?: boolean; redirect?: string; error?: string };

export async function resetPassword(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const locale = await getLocale();
  const t = makeUI(locale);

  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!token) return { error: t("auth.resetInvalidLink") };
  if (password !== passwordConfirm) return { error: t("auth.resetMismatch") };
  if (password.length < 8) return { error: t("auth.resetWeak") };

  const result = await redeemPasswordResetToken(token, password);
  if (!result.ok) {
    if (result.reason === "expired") return { error: t("auth.resetExpired") };
    if (result.reason === "weak") return { error: t("auth.resetWeak") };
    return { error: t("auth.resetInvalid") };
  }

  // Don't redirect() here — same reason as /login/actions.ts: report success
  // and let the client navigate with a fresh full request.
  return { ok: true, redirect: "/login" };
}
