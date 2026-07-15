import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

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
  if (!user || !user.passwordHash) return { ok: false, reason: "invalid" };
  const passOk = await bcrypt.compare(plain, user.passwordHash);
  if (!passOk) return { ok: false, reason: "invalid" };
  if (!user.isActive) return { ok: false, reason: "deactivated" };
  return {
    ok: true,
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
  };
}

/** Verify a plaintext password against a specific user's stored hash. */
export async function verifyUserPasswordById(
  userId: number,
  plain: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) return false;
  return bcrypt.compare(plain, user.passwordHash);
}

/** Replace a specific user's password hash (`User.passwordHash`). */
export async function setUserPassword(userId: number, plain: string): Promise<void> {
  const hash = await bcrypt.hash(plain, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
}
