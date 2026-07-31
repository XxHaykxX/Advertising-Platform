"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { parseWebsiteUrl } from "@/lib/website-url";

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

export type CreatorProfileFormState = {
  ok?: true;
  error?: string;
  /** The normalised value actually stored, echoed back on success only
   *  (IA-35, mirrors BrandProfileFormState) — without it the field goes on
   *  showing whatever was typed even after `\\example.com` is rewritten to
   *  `https://example.com` before it hits the database. */
  website?: string | null;
};

/** Update the current CREATOR member's own profile — display name, avatar,
 *  phone, website. Re-checks requireMember() + role itself (defense in
 *  depth; reachable via direct POST). Email stays read-only. The avatar path
 *  is whatever the member-scoped MediaField picked (/uploads/members/<id>/…)
 *  or "" to clear — validated below so a member can't point their avatar at
 *  another member's uploads or an external URL. */
export async function updateCreatorProfile(
  _prev: CreatorProfileFormState,
  formData: FormData,
): Promise<CreatorProfileFormState> {
  const user = await requireMember();
  const locale = await getLocale();
  const t = makeUI(locale);
  if (user.role !== "CREATOR") return { error: t("account.form.errRequired") };

  const name = String(formData.get("name") ?? "").trim();
  const rawAvatar = String(formData.get("avatar") ?? "").trim();
  // The country picker seeds the field with a bare dial code ("+374"), so an
  // untouched field arrives as that rather than empty — stored as no number,
  // not as a "+374" that nobody can call.
  const rawPhone = String(formData.get("phone") ?? "").trim();
  const phone = /^\+\d{1,4}$/.test(rawPhone) ? "" : rawPhone;
  // Same parser the brand profile form uses (IA-35) — this field used to be
  // written raw, so `\example.com` (missing a leading slash, which the URL
  // parser folds to a slash and the browser's own `type="url"` check lets
  // through unfixed) was stored verbatim instead of normalised.
  const websiteRaw = String(formData.get("website") ?? "").trim().slice(0, 2000);
  const websiteParsed = parseWebsiteUrl(websiteRaw);
  if (!websiteParsed.ok) return { error: t("account.brand.websiteInvalid") };
  const website = websiteParsed.value ? websiteParsed.value.slice(0, 191) : null;

  if (!name) return { error: t("account.profile.nameRequired") };

  const avatar = rawAvatar === "" || rawAvatar.startsWith(`/uploads/members/${user.id}/`) ? rawAvatar : "";

  await prisma.user.update({
    where: { id: user.id },
    data: { name: name.slice(0, 120), avatar: avatar || null, phone: phone || null, website },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { ok: true, website };
}
