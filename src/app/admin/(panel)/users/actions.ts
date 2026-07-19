"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

export type FormState = {
  error?: string;
  values?: { email: string; name: string };
};
export type ResetState = { ok?: boolean; error?: string };

function str(fd: FormData, key: string) {
  return String(fd.get(key) || "").trim();
}

/** Create a new Publisher account (email + company name + password).
   Super-admin creates all Publisher logins — there is no self-registration. */
export async function createPublisher(_p: FormState, fd: FormData): Promise<FormState> {
  await requireSuperadmin();
  const t = makeUI(await getLocale());

  const email = str(fd, "email").toLowerCase();
  const name = str(fd, "name");
  const password = str(fd, "password");
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
      data: { email, name, passwordHash, role: "PUBLISHER" },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: t("register.errEmailTaken"), values };
    }
    throw err;
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
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
