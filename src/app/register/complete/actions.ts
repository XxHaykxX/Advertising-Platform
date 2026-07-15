"use server";

import { cookies } from "next/headers";
import { createGoogleMember } from "@/lib/auth/members";
import { verifyPendingGoogle, G_PENDING_COOKIE } from "@/lib/auth/google";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth/session";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export type CompleteState = { error?: string; ok?: boolean; redirect?: string };

/** Finish a Google sign-up: read the verified profile from the g_pending cookie,
   create an APPROVED member with the chosen account type, sign them in, and
   clear the pending cookie. */
export async function completeRegister(
  _prev: CompleteState,
  formData: FormData,
): Promise<CompleteState> {
  const locale = await getLocale();
  const t = makeUI(locale);

  const c = await cookies();
  const pending = await verifyPendingGoogle(c.get(G_PENDING_COOKIE)?.value);
  if (!pending) return { error: t("register.errFields") };

  const type = String(formData.get("type") ?? "brand");
  const company = String(formData.get("company") ?? "").trim();
  const role = type === "creator" ? "CREATOR" : "BRAND";

  const result = await createGoogleMember({
    googleId: pending.sub,
    email: pending.email,
    name: pending.name,
    role,
    company: company || null,
  });
  if (!result.ok) return { error: t("register.errEmailTaken") };

  c.delete(G_PENDING_COOKIE);

  // No moderation queue — the account is APPROVED immediately, so sign the
  // new member straight in and drop them into their cabinet.
  const token = await createSessionToken(result.userId, role);
  c.set(SESSION_COOKIE, token, sessionCookieOptions());

  // Don't redirect() here: this cookie was just set in a useActionState
  // action, and Next 16 would render /account from the root in the same
  // action response before the cookie is visible to the auth gate — a
  // nested redirect there crashes the flight tree into global-error. Instead
  // report success and let the client navigate with a fresh full request.
  return { ok: true, redirect: "/account" };
}
