"use server";

import { cookies } from "next/headers";
import { createGoogleMember } from "@/lib/auth/members";
import { verifyPendingGoogle, G_PENDING_COOKIE } from "@/lib/auth/google";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export type CompleteState = { error?: string; ok?: boolean };

/** Finish a Google sign-up: read the verified profile from the g_pending cookie,
   create a PENDING member with the chosen account type, and clear the cookie. */
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
  return { ok: true };
}
