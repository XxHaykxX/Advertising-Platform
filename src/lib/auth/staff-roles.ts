import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

/* The four roles a super-admin can assign to a staff account, and the DB
   logic behind a role change. Kept separate from BRAND/CREATOR (see
   members.ts) — those are member roles with their own status/approval flow
   and are never reachable through this path.

   No auth check of its own here, same split as members.ts: requireSuperadmin
   lives in the "use server" action that calls changeStaffRole, so this file
   is a plain function the integration test can call directly without faking
   a session/cookies. */

export const STAFF_ROLES = ["SUPERADMIN", "PUBLISHER", "MODERATOR", "TRANSLATOR"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(role: Role | string): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  SUPERADMIN: "Super-admin",
  PUBLISHER: "Publisher",
  MODERATOR: "Moderator",
  TRANSLATOR: "Translator",
};

// What each role is limited to, once it's no longer Super-admin — used to
// spell out in the change-role confirm dialog what the person will lose,
// instead of just naming the new role (an owner reading "Translator" doesn't
// necessarily know that means everything else goes away).
const STAFF_ROLE_SCOPE: Record<Exclude<StaffRole, "SUPERADMIN">, string> = {
  PUBLISHER: "creating and editing project content",
  MODERATOR: "moderating submitted projects",
  TRANSLATOR: "the translations editor",
};

/** Human sentence for the change-role confirm dialog. */
export function roleChangeMessage(name: string, toRole: StaffRole): string {
  if (toRole === "SUPERADMIN") {
    return `${name} will gain full access to everything, including staff and settings.`;
  }
  return `${name} will be limited to ${STAFF_ROLE_SCOPE[toRole]}.`;
}

export type ChangeRoleResult =
  | { ok: true }
  | { ok: false; reason: "self" | "invalid_role" | "not_staff" | "last_superadmin" };

/** Change a staff account's role. Pure DB logic, no auth check of its own —
   the caller ("use server" action setUserRole) must call requireSuperadmin()
   first. Guards, in order:
     - actor can't change their own role (they'd lose the page mid-request);
     - the new role must be one of the four staff roles (never BRAND/CREATOR
       — those live on the member side, with their own status/approval flow);
     - the target must currently be a staff account (a stray id can never
       flip a member's role through this path, mirroring setMemberStatus's
       scoping the other way);
     - the last remaining Super-admin can't be demoted — the system would be
       left with no owner, recoverable only by editing the database directly. */
export async function changeStaffRole(
  actorId: number,
  targetId: number,
  newRole: string,
): Promise<ChangeRoleResult> {
  if (actorId === targetId) return { ok: false, reason: "self" };
  if (!isStaffRole(newRole)) return { ok: false, reason: "invalid_role" };

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target || !isStaffRole(target.role)) return { ok: false, reason: "not_staff" };

  if (target.role === "SUPERADMIN" && newRole !== "SUPERADMIN") {
    // Only an ACTIVE super-admin counts as a replacement: requireUser() rejects
    // isActive=false outright (require.ts), so a deactivated owner cannot sign
    // in. Counting them would let the last usable super-admin be demoted and
    // lock everyone out, recoverable only by editing the database.
    const otherSuperadmins = await prisma.user.count({
      where: { role: "SUPERADMIN", isActive: true, id: { not: targetId } },
    });
    if (otherSuperadmins === 0) return { ok: false, reason: "last_superadmin" };
  }

  await prisma.user.update({ where: { id: targetId }, data: { role: newRole as StaffRole } });
  return { ok: true };
}
