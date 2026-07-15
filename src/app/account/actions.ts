"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth/session";

/** Logs the current member out by clearing the session cookie, then sends
 *  them back to the homepage. */
export async function logout() {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
  redirect("/");
}
