import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { AccountStatus } from "@prisma/client";

/* Self-serve member accounts (BRAND / CREATOR). Separate from staff
   (SUPERADMIN / PUBLISHER / MODERATOR) auth: members register straight into
   APPROVED (no moderation queue) and can sign in immediately, but can still
   be REJECTED/BLOCKED by an admin at any time. Staff accounts never flow
   through here — they use /admin/login. */

export type MemberRole = "BRAND" | "CREATOR";

// Compared against on the unknown-email path so a miss costs the same bcrypt
// time as a wrong password — avoids account-enumeration via response timing.
const DUMMY_HASH = bcrypt.hashSync("unused-dummy-password-for-timing", 10);

export type CreateMemberResult =
  | { ok: true; userId: number }
  | { ok: false; reason: "email_taken" };

/** Create an APPROVED member account. Password is bcrypt-hashed; the account
   can sign in immediately — no admin moderation step. An admin may still
   REJECT/BLOCK it later from /admin/registrations. */
export async function createMember(input: {
  name: string;
  email: string;
  password: string;
  role: MemberRole;
  company?: string | null;
}): Promise<CreateMemberResult> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, reason: "email_taken" };

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash,
      role: input.role,
      status: "APPROVED",
      company: input.company?.trim() || null,
    },
  });
  return { ok: true, userId: user.id };
}

export type MemberAuthResult =
  | {
      ok: true;
      user: { id: number; email: string; role: MemberRole; name: string };
    }
  | { ok: false; reason: "invalid" | "pending" | "blocked" | "rejected" };

/** Verify member credentials AND approval state. Staff accounts are rejected
   as "invalid" here (they must use /admin/login), so this endpoint never grants
   a member session to a privileged user. */
export async function authenticateMember(
  email: string,
  password: string,
): Promise<MemberAuthResult> {
  const e = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: e } });
  // Unknown email OR a Google-only account (no passwordHash) → treat as invalid,
  // but still spend the bcrypt time to avoid enumeration via response timing.
  if (!user || !user.passwordHash) {
    await bcrypt.compare(password, DUMMY_HASH);
    return { ok: false, reason: "invalid" };
  }

  const passOk = await bcrypt.compare(password, user.passwordHash);
  if (!passOk) return { ok: false, reason: "invalid" };

  if (user.role !== "BRAND" && user.role !== "CREATOR") {
    return { ok: false, reason: "invalid" };
  }
  if (!user.isActive || user.status === "BLOCKED") return { ok: false, reason: "blocked" };
  if (user.status === "REJECTED") return { ok: false, reason: "rejected" };
  if (user.status !== "APPROVED") return { ok: false, reason: "pending" };

  return {
    ok: true,
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
  };
}

/** Look up a member by their Google account id (OAuth sign-in). */
export async function findMemberByGoogleId(googleId: string) {
  return prisma.user.findUnique({ where: { googleId } });
}

/** Create an APPROVED member from a verified Google profile. No password
   hash — the account signs in via Google only. Email/googleId must both be
   unused. Signs in immediately — no admin moderation step. */
export async function createGoogleMember(input: {
  googleId: string;
  email: string;
  name: string;
  role: MemberRole;
  company?: string | null;
}): Promise<CreateMemberResult> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { googleId: input.googleId }] },
  });
  if (existing) return { ok: false, reason: "email_taken" };

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      googleId: input.googleId,
      passwordHash: null,
      role: input.role,
      status: "APPROVED",
      company: input.company?.trim() || null,
    },
  });
  return { ok: true, userId: user.id };
}

/** Admin-side status transition (approve / reject / block / unblock). The
   caller is responsible for the staff authorization check. Scoped to member
   rows (BRAND/CREATOR) so a stray userId can never flip a staff account's
   status — a non-member id is a silent no-op. */
export async function setMemberStatus(userId: number, status: AccountStatus): Promise<void> {
  await prisma.user.updateMany({
    where: { id: userId, role: { in: ["BRAND", "CREATOR"] } },
    data: { status },
  });
}
