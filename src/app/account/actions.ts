"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

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

export type CreatorProfileFormState = { ok?: true; error?: string };

/** Update the current CREATOR member's own profile — display name + avatar.
 *  Re-checks requireMember() + role itself (defense in depth; reachable via
 *  direct POST). Email stays read-only. The avatar path is whatever the
 *  member-scoped MediaField picked (/uploads/members/<id>/…) or "" to clear. */
export async function updateCreatorProfile(
  _prev: CreatorProfileFormState,
  formData: FormData,
): Promise<CreatorProfileFormState> {
  const user = await requireMember();
  const locale = await getLocale();
  const t = makeUI(locale);
  if (user.role !== "CREATOR") return { error: t("account.form.errRequired") };

  const name = String(formData.get("name") ?? "").trim();
  const avatar = String(formData.get("avatar") ?? "").trim();

  if (!name) return { error: t("account.profile.nameRequired") };

  await prisma.user.update({
    where: { id: user.id },
    data: { name, avatar: avatar || null },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { ok: true };
}
