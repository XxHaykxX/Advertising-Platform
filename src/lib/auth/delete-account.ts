import { prisma } from "@/lib/prisma";

/* Delete a staff or member account outright — reachable from both tabs of
   /admin/users. Pure DB logic, no auth check of its own — the caller
   ("use server" action deleteUserAccount) must call requireSuperadmin()
   first, same split as changeStaffRole (staff-roles.ts). Guards, in order:
     - the actor can't delete their own account (they'd lose the page
       mid-request, same reasoning as changeStaffRole's "self" guard);
     - the last remaining ACTIVE super-admin can't be deleted — identical
       "otherSuperadmins" check to changeStaffRole's last_superadmin guard,
       so the system is never left with no usable owner. Only ACTIVE counts:
       requireUser() rejects isActive=false outright (require.ts), so a
       deactivated super-admin can't sign back in to undo this;
     - an account that still owns projects or ad spaces can't be deleted.
       Project.ownerId and AdSpace.ownerId are both required, unguarded
       relations (schema.prisma — checked, nothing else on User is) — MySQL
       would refuse the delete at the FK level regardless, but counting first
       lets the caller explain what's in the way instead of surfacing a raw
       constraint error. Both are content brands pay for (or pay to place
       on), so neither is ever dropped alongside the account — the owner has
       to reassign or remove it first. Originally only projects were counted
       (#60, found in QA-5) — a CREATOR with ad spaces but no projects passed
       this gate and crashed on the AdSpace FK instead.
   Everything else hanging off the user cascades on its own (Notification,
   PushSubscription, PasswordResetToken, Interest, Favorite) or is set to
   null (ContentVersion.authorId, UiDraft.updatedById, I18nPublish.userId,
   Project.updatedById) — see schema.prisma. */

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; reason: "self" | "not_found" | "last_superadmin" }
  | { ok: false; reason: "has_content"; projectCount: number; adSpaceCount: number };

export async function deleteAccount(actorId: number, targetId: number): Promise<DeleteAccountResult> {
  if (actorId === targetId) return { ok: false, reason: "self" };

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return { ok: false, reason: "not_found" };

  if (target.role === "SUPERADMIN") {
    const otherSuperadmins = await prisma.user.count({
      where: { role: "SUPERADMIN", isActive: true, id: { not: targetId } },
    });
    if (otherSuperadmins === 0) return { ok: false, reason: "last_superadmin" };
  }

  const [projectCount, adSpaceCount] = await Promise.all([
    prisma.project.count({ where: { ownerId: targetId } }),
    prisma.adSpace.count({ where: { ownerId: targetId } }),
  ]);
  if (projectCount > 0 || adSpaceCount > 0) {
    return { ok: false, reason: "has_content", projectCount, adSpaceCount };
  }

  await prisma.user.delete({ where: { id: targetId } });
  return { ok: true };
}

/** Human sentence for the delete confirm dialog — names what disappears
   along with the account, the same spelled-out-not-just-named approach as
   roleChangeMessage. Interest/Favorite ("applications" / "shortlist") only
   exist for an account that can buy — keyed on the isBrand flag, not the
   legacy `role` column (QA-5, 2026-08-11): a dual-side member's stored role
   is whichever side they registered as first and doesn't change when they
   later switch on buying too, so a role-only check under-reported what a
   CREATOR-by-role, isBrand=true member was about to lose. */
export function deleteAccountMessage(name: string, isBrand: boolean): string {
  const extra = isBrand ? ", their saved shortlist and submitted applications" : "";
  return `${name}'s account and their notifications${extra} will be permanently deleted. This can't be undone.`;
}
