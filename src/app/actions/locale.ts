"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n";

/** Persist the chosen UI locale in a cookie (1 year). */
export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  const c = await cookies();
  c.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
