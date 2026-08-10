"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { MEMBER_SESSION_COOKIE } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth/require";
import { canSell } from "@/lib/auth/capabilities";
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
  // Member cookie only — a staff session in the same browser is a separate
  // login and stays untouched (IA-47).
  c.delete(MEMBER_SESSION_COOKIE);
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
 *  phone, website. Re-checks requireMember() + canSell() itself (defense in
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
  if (!canSell(user)) return { error: t("account.form.errRequired") };

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
  // name/avatar/phone/website are the same User columns the brand profile
  // form edits (QA-5, 2026-08-11) — without this a dual member's brand-side
  // Router Cache segment goes on showing the pre-edit value until it expires
  // on its own, even though the DB row already changed.
  revalidatePath("/account/brand/profile");
  return { ok: true, website };
}

export type EnableSideResult = { ok: true; redirect: string } | { ok: false };

/** Turns the BRAND side on for the current member — the one-click "start
 *  buying" from the header switcher (A4/A5, 2026-08-11). No wizard: the
 *  brand profile's extra fields (company/brandCategories/budgetRange) are
 *  already nullable, so there's nothing this side needs that isn't already
 *  on the row — the member just lands on that profile, empty, with its own
 *  hint text. Separate export from enableCreatorSide on purpose: a shared
 *  `setSide(name)` would let the caller pick which flag to flip, and every
 *  export of a "use server" module is a public, ungated RPC. Returns instead
 *  of calling redirect() itself — redirect() inside a Server Action causes a
 *  ChunkLoadError on production; the caller does
 *  window.location.assign(res.redirect). */
export async function enableBrandSide(): Promise<EnableSideResult> {
  const user = await requireMember();
  await prisma.user.update({ where: { id: user.id }, data: { isBrand: true } });
  revalidatePath("/account");
  revalidatePath("/account/brand");
  return { ok: true, redirect: "/account/brand/profile" };
}

/** Turns the CREATOR side on — the header switcher's "start selling". Lands
 *  on /account, which already has an empty state and a link to
 *  /for-creators for someone who has never submitted a project. See
 *  enableBrandSide above for why this isn't a shared parameterised action. */
export async function enableCreatorSide(): Promise<EnableSideResult> {
  const user = await requireMember();
  await prisma.user.update({ where: { id: user.id }, data: { isCreator: true } });
  revalidatePath("/account");
  revalidatePath("/account/brand");
  return { ok: true, redirect: "/account" };
}
