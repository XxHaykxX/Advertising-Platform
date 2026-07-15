"use server";

import { createMember } from "@/lib/auth/members";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export type RegisterState = { error?: string; ok?: boolean };

export async function register(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const locale = await getLocale();
  const t = makeUI(locale);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const company = String(formData.get("company") ?? "").trim();
  const type = String(formData.get("type") ?? "brand");

  if (!name || !email || !password) {
    return { error: t("register.errFields") };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: t("register.errFields") };
  }
  if (password.length < 8) {
    return { error: t("register.errPasswordShort") };
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
      return { error: t("register.errEmailTaken") };
    }
    return { error: t("register.errFields") };
  }

  return { ok: true };
}
