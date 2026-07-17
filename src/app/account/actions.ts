"use server";

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";

/** Logs the current member out by clearing the session cookie. Doesn't
 *  redirect() itself — on Hostinger/Passenger a redirect() inside a server
 *  action crashes the in-flight flight tree (same class of bug as
 *  login/register). Instead it reports where to go and LogoutButton
 *  navigates on the client with a fresh full request. */
export async function logout(): Promise<{ ok: true; redirect: string }> {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
  return { ok: true, redirect: "/" };
}
