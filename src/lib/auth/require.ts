import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  canEditContent,
  canEditTranslations,
  canModerate,
  isTranslatorOnly,
} from "@/lib/auth/permissions";
import type { Role } from "@prisma/client";

/* A rejected session is sent through the signout route, not straight to the
   login page. Straight to /login is what caused ERR_TOO_MANY_REDIRECTS for a
   member blocked mid-session: the cookie is still validly signed, so proxy.ts
   reads it as "a member" and bounces back into the cabinet, which lands here
   again. Only clearing the cookie ends that, and a server component can't —
   see src/app/api/auth/signout/route.ts. */
const SIGNOUT_MEMBER = "/api/auth/signout";
const SIGNOUT_STAFF = "/api/auth/signout?to=staff";

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
export const loadCurrentUser = cache(async function loadCurrentUser(): Promise<AuthedUser | null> {
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
});

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

/** True for any staff role that may sign in at /admin (SUPERADMIN, PUBLISHER,
   MODERATOR, TRANSLATOR). Members (BRAND / CREATOR) are not staff. */
function isStaffRole(role: Role): boolean {
  return (
    role === "SUPERADMIN" ||
    role === "PUBLISHER" ||
    role === "MODERATOR" ||
    role === "TRANSLATOR"
  );
}

/** Require a logged-in, active staff user (SUPERADMIN, PUBLISHER or
   MODERATOR). Members (BRAND / CREATOR) are bounced to /admin/login — they
   can never reach the admin panel even with a valid member session. */
export async function requireUser(): Promise<AuthedUser> {
  const user = await loadCurrentUser();
  if (!user) redirect(SIGNOUT_STAFF);
  if (!isStaffRole(user.role)) redirect(SIGNOUT_STAFF);
  return user;
}

/** Require an approved, active member (BRAND / CREATOR). Redirects to /login
   otherwise (unauthenticated, staff, or not-yet-approved / blocked). */
export async function requireMember(): Promise<AuthedUser> {
  const user = await loadCurrentMember();
  if (!user) redirect(SIGNOUT_MEMBER);
  return user;
}

/** Require a logged-in, active SUPERADMIN. 404s otherwise (Publishers must
   not be able to distinguish "doesn't exist" from "not allowed"). */
export async function requireSuperadmin(): Promise<AuthedUser> {
  const user = await requireUser();
  if (user.role !== "SUPERADMIN") notFound();
  return user;
}

/** Require a logged-in, active staff user who may create/edit project content
   (SUPERADMIN or PUBLISHER — see permissions.ts). 404s otherwise, same
   disguise-as-not-found pattern as requireSuperadmin: a Moderator hitting a
   content action directly (bypassing admin-nav, which already hides the
   link) must not be able to tell "doesn't exist" from "not allowed". */
export async function requireContentEditor(): Promise<AuthedUser> {
  const user = await requireUser();
  if (!canEditContent(user.role)) notFound();
  return user;
}

/** Require a logged-in, active staff user who may moderate submitted projects
   (SUPERADMIN or MODERATOR — see permissions.ts). 404s otherwise, same
   pattern as requireContentEditor/requireSuperadmin. Guards the moderation
   actions/pages. */
export async function requireModerator(): Promise<AuthedUser> {
  const user = await requireUser();
  if (!canModerate(user.role)) notFound();
  return user;
}

/** Require a logged-in, active staff user who may edit the UI dictionary
   (SUPERADMIN or TRANSLATOR — see permissions.ts). 404s otherwise, same
   disguise-as-not-found pattern as the guards above. Guards /admin/i18n and
   every translation action. */
export async function requireTranslator(): Promise<AuthedUser> {
  const user = await requireUser();
  if (!canEditTranslations(user.role)) notFound();
  return user;
}

/** Require a logged-in, active staff user who isn't confined to the
   TRANSLATOR-only section (SUPERADMIN, PUBLISHER or MODERATOR). 404s for
   TRANSLATOR, same disguise-as-not-found pattern as the guards above — that
   role's only admin page is /admin/i18n (audit 3.4: Notifications was still
   reachable directly via requireUser()). */
export async function requireStaffExceptTranslator(): Promise<AuthedUser> {
  const user = await requireUser();
  if (isTranslatorOnly(user.role)) notFound();
  return user;
}

/** True when the current request carries a valid, active session. Kept for
   call sites (e.g. API routes) that only need a boolean. */
export async function isAuthed(): Promise<boolean> {
  return (await loadCurrentUser()) !== null;
}
