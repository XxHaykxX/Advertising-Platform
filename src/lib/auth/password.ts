import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const KEY = "admin_password_hash";

async function getHash(): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  return row?.value ?? null;
}

/** Verify a plaintext password against the stored bcrypt hash. */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const hash = await getHash();
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export type VerifyResult =
  | { ok: true; user: { id: number; email: string; role: Role; name: string } }
  | { ok: false; reason: "invalid" | "deactivated" };

/** Verify email + plaintext password against `User.passwordHash`.
   Unknown email or wrong password → "invalid" (never reveals which part was
   wrong). A correct password on a disabled account → "deactivated", so the
   user gets an accurate message instead of a misleading "wrong password". */
export async function verifyUserPassword(
  email: string,
  plain: string,
): Promise<VerifyResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: false, reason: "invalid" };
  const passOk = await bcrypt.compare(plain, user.passwordHash);
  if (!passOk) return { ok: false, reason: "invalid" };
  if (!user.isActive) return { ok: false, reason: "deactivated" };
  return {
    ok: true,
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
  };
}

/** Replace the admin password hash. */
export async function setAdminPassword(password: string): Promise<void> {
  const hash = await bcrypt.hash(password, 10);
  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: hash },
    create: { key: KEY, value: hash },
  });
}

/** Verify a plaintext password against a specific user's stored hash. */
export async function verifyUserPasswordById(
  userId: number,
  plain: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  return bcrypt.compare(plain, user.passwordHash);
}

/** Replace a specific user's password hash (`User.passwordHash`). */
export async function setUserPassword(userId: number, plain: string): Promise<void> {
  const hash = await bcrypt.hash(plain, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
}
