import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { setUserPassword } from "@/lib/auth/password";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function sha256hex(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Start a password-reset flow for `email`. Always looks like it worked to
   the caller — returns null both when the email is unknown AND when the
   account has no password (Google-only), so the caller's "email sent"
   message never leaks which accounts exist. Only a SHA-256 hash of the raw
   token is persisted; the raw token is returned for the emailed link. */
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return null;

  const raw = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256hex(raw),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return raw;
}

export type RedeemResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "weak" };

/** Consume a raw reset token and set the new password. One-shot: the row is
   marked usedAt on success, and any other outstanding tokens for that user
   are invalidated too (a fresh request supersedes older links). */
export async function redeemPasswordResetToken(
  rawToken: string,
  newPassword: string,
): Promise<RedeemResult> {
  if (newPassword.length < 8) return { ok: false, reason: "weak" };

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: sha256hex(rawToken) },
  });
  if (!row || row.usedAt) return { ok: false, reason: "invalid" };
  if (row.expiresAt < new Date()) return { ok: false, reason: "expired" };

  // Set the password first, then burn the token — if the update fails, the
  // token stays valid and the user can retry instead of being locked out.
  await setUserPassword(row.userId, newPassword);
  await prisma.$transaction([
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: row.userId, id: { not: row.id } },
    }),
  ]);

  return { ok: true };
}
