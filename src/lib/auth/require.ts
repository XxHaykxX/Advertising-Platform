import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export type AuthedUser = {
  id: number;
  email: string;
  role: Role;
  name: string;
  isActive: boolean;
};

/** Loads the current session's user from the DB. Returns null unless the
   token is valid AND the user still has isActive=true — this is the instant-
   deactivation gate: a deactivated Publisher is locked out on the very next
   request, since we re-check the DB (not just the JWT) on every call. */
async function loadCurrentUser(): Promise<AuthedUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    isActive: user.isActive,
  };
}

/** Loads the current session's user only if it is an approved, active member
   (BRAND / CREATOR). Blocked/pending/rejected members and staff users → null.
   Re-checks the DB each call, so blocking a member locks them out immediately. */
async function loadCurrentMember(): Promise<AuthedUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user || !user.isActive) return null;
  if (user.role !== "BRAND" && user.role !== "CREATOR") return null;
  if (user.status !== "APPROVED") return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    isActive: user.isActive,
  };
}

/** Require a logged-in, active staff user (SUPERADMIN or PUBLISHER). Members
   (BRAND / CREATOR) are bounced to /admin/login — they can never reach the
   admin panel even with a valid member session. */
export async function requireUser(): Promise<AuthedUser> {
  const user = await loadCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "SUPERADMIN" && user.role !== "PUBLISHER") redirect("/admin/login");
  return user;
}

/** Require an approved, active member (BRAND / CREATOR). Redirects to /login
   otherwise (unauthenticated, staff, or not-yet-approved / blocked). */
export async function requireMember(): Promise<AuthedUser> {
  const user = await loadCurrentMember();
  if (!user) redirect("/login");
  return user;
}

/** Require a logged-in, active SUPERADMIN. 404s otherwise (Publishers must
   not be able to distinguish "doesn't exist" from "not allowed"). */
export async function requireSuperadmin(): Promise<AuthedUser> {
  const user = await requireUser();
  if (user.role !== "SUPERADMIN") notFound();
  return user;
}

/** True when the current request carries a valid, active session. Kept for
   call sites (e.g. API routes) that only need a boolean. */
export async function isAuthed(): Promise<boolean> {
  return (await loadCurrentUser()) !== null;
}
