"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CURRENCY_COOKIE, isCurrency } from "@/lib/currency";

/** Persist the chosen display currency in a cookie (1 year) and refresh the tree. */
export async function setCurrency(currency: string) {
  if (!isCurrency(currency)) return;
  const c = await cookies();
  c.set(CURRENCY_COOKIE, currency, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
