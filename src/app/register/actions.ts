"use server";

import { cookies } from "next/headers";
import { createMember } from "@/lib/auth/members";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth/session";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export type RegisterState = {
  error?: string;
  ok?: boolean;
  redirect?: string;
  // Echoed back on failed submits so React 19's uncontrolled-input reset
  // after the action runs doesn't wipe what the user typed (same pattern as
  // submitLead/portfolio-form). Password is deliberately excluded — it's
  // kept alive client-side instead (see register-form.tsx).
  values?: { name?: string; email?: string; company?: string };
};

export async function register(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const locale = await getLocale();
  const t = makeUI(locale);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  // Trimmed like every other password entry point — pasted passwords often
  // carry a stray trailing space/newline. Interior spaces are kept.
  const password = String(formData.get("password") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const type = String(formData.get("type") ?? "brand");
  const values = { name, email, company };

  if (!name || !email || !password) {
    return { error: t("register.errFields"), values };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: t("register.errFields"), values };
  }
  if (password.length < 8) {
    return { error: t("register.errPasswordShort"), values };
  }

  const role = type === "creator" ? "CREATOR" : "BRAND";

  const result = await createMember({
    name,
    email,
    password,
    role,
    company: company || null,
  });

  if (!result.ok) {
    if (result.reason === "email_taken") {
      return { error: t("register.errEmailTaken"), values };
    }
    return { error: t("register.errFields"), values };
  }

  // No moderation queue — the account is APPROVED immediately, so sign the
  // new member straight in and drop them into their cabinet (same session
  // pattern as /login/actions.ts).
  const token = await createSessionToken(result.userId, role);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions());

  // Don't redirect() here: this cookie was just set in a useActionState
  // action, and Next 16 would render /account from the root in the same
  // action response before the cookie is visible to the auth gate — a
  // nested redirect there crashes the flight tree into global-error. Instead
  // report success and let the client navigate with a fresh full request.
  return { ok: true, redirect: "/account" };
}
