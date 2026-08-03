"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { changeStaffRole } from "@/lib/auth/staff-roles";
import { deleteAccount } from "@/lib/auth/delete-account";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export type FormState = {
  error?: string;
  values?: { email: string; name: string };
  // Success is REPORTED, not acted on: createMember must not call redirect()
  // itself — see the redirect contract in ../partners/actions.ts. The account
  // was created either way, so a thrown NEXT_REDIRECT that the client turns
  // into "something went wrong" is a lie about a write that succeeded.
  ok?: boolean;
  redirect?: string;
};
export type ResetState = { ok?: boolean; error?: string };
export type RoleState = { ok?: boolean; error?: string };

function str(fd: FormData, key: string) {
  return String(fd.get(key) || "").trim();
}

// Staff roles a super-admin can create from the Users page. Publisher is
// intentionally NOT offered here anymore — only Super-admin, Moderator and
// Translator (the content writer's dictionary-only login).
const CREATABLE_ROLES = ["SUPERADMIN", "MODERATOR", "TRANSLATOR"] as const;
type CreatableRole = (typeof CREATABLE_ROLES)[number];

/** Create a new staff account (email + name + password + role). Super-admin
   creates all staff logins — there is no self-registration for staff. */
export async function createMember(_p: FormState, fd: FormData): Promise<FormState> {
  await requireSuperadmin();
  const t = makeUI(await getLocale());

  const email = str(fd, "email").toLowerCase();
  const name = str(fd, "name");
  const password = str(fd, "password");
  const roleRaw = str(fd, "role");
  const role: CreatableRole = (CREATABLE_ROLES as readonly string[]).includes(roleRaw)
    ? (roleRaw as CreatableRole)
    : "MODERATOR";
  // Echoed back on every error branch below so the non-password fields
  // survive React 19's automatic reset of these uncontrolled inputs after a
  // failed submit (same pattern as the portfolio form). The password itself
  // is never echoed through server state — that field is kept controlled
  // client-side instead (see user-form.tsx).
  const values = { email, name };

  if (!email) return { error: t("formErr.email"), values };
  if (!name) return { error: t("formErr.name"), values };
  if (password.length < 8) return { error: t("auth.resetWeak"), values };

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: { email, name, passwordHash, role },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: t("register.errEmailTaken"), values };
    }
    throw err;
  }

  revalidatePath("/admin/users");
  return { ok: true, redirect: "/admin/users" };
}

/** Deactivate/reactivate a user. Deactivation is instant — requireUser() checks
   isActive against the DB on every subsequent admin request, so a deactivated
   Publisher is locked out immediately without touching their live projects. */
export async function setUserActive(id: number, isActive: boolean) {
  const me = await requireSuperadmin();
  // Refuse to lock yourself out.
  if (me.id === id && !isActive) return;
  await prisma.user.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/users");
}

/** Reset a user's password. Credentials are handed off manually by the
   super-admin — there is no email-based recovery flow. */
export async function resetUserPassword(
  id: number,
  _p: ResetState,
  fd: FormData,
): Promise<ResetState> {
  await requireSuperadmin();
  const t = makeUI(await getLocale());

  const password = str(fd, "password");
  if (password.length < 8) return { error: t("auth.resetWeak") };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  revalidatePath("/admin/users");
  return { ok: true };
}

type ChangeRoleReason = Extract<Awaited<ReturnType<typeof changeStaffRole>>, { ok: false }>["reason"];

// Human copy for changeStaffRole's refusal reasons — see staff-roles.ts for
// what each one guards against.
const ROLE_CHANGE_ERROR: Record<ChangeRoleReason, string> = {
  self: "You can't change your own role — ask another super-admin.",
  invalid_role: "Not a valid staff role.",
  not_staff: "That account isn't a staff account.",
  last_superadmin: "Can't change this — they're the only super-admin left.",
};

/** Change a staff account's role (SUPERADMIN/PUBLISHER/MODERATOR/TRANSLATOR
   only — see changeStaffRole for the guards: no self-change, no demoting the
   last super-admin, no crossing into BRAND/CREATOR). */
export async function setUserRole(id: number, role: string): Promise<RoleState> {
  const me = await requireSuperadmin();
  const res = await changeStaffRole(me.id, id, role);
  if (!res.ok) return { error: ROLE_CHANGE_ERROR[res.reason] };
  revalidatePath("/admin/users");
  return { ok: true };
}

export type DeleteState = { ok?: boolean; error?: string };

// Human copy for deleteAccount's refusal reasons — see delete-account.ts for
// what each one guards against. has_projects carries a count, so it's built
// separately below instead of living in this static map.
const DELETE_ACCOUNT_ERROR: Record<"self" | "not_found" | "last_superadmin", string> = {
  self: "You can't delete your own account.",
  not_found: "That account no longer exists.",
  last_superadmin: "Can't delete this — they're the only super-admin left.",
};

/** Delete a staff or member account outright (see deleteAccount for the
   guards: no self-delete, no deleting the last super-admin, no deleting an
   account that still owns projects — those are content brands paid for and
   are never dropped silently). Reachable from both the Staff and Members
   tabs of /admin/users. */
export async function deleteUserAccount(id: number): Promise<DeleteState> {
  const me = await requireSuperadmin();
  const res = await deleteAccount(me.id, id);
  if (!res.ok) {
    if (res.reason === "has_projects") {
      const n = res.projectCount;
      return { error: `Can't delete — this account owns ${n} project${n === 1 ? "" : "s"}. Reassign or remove them first.` };
    }
    return { error: DELETE_ACCOUNT_ERROR[res.reason] };
  }
  revalidatePath("/admin/users");
  return { ok: true };
}
