"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireContentEditor } from "@/lib/auth/require";
import { setMemberStatus } from "@/lib/auth/members";

/** Approve a pending (or previously rejected) member — grants sign-in access. */
export async function approveMember(userId: number) {
  await requireContentEditor();
  await setMemberStatus(userId, "APPROVED");
  revalidatePath("/admin/users");
}

/** Reject a pending registration. Rejected members can be approved later if reconsidered. */
export async function rejectMember(userId: number) {
  await requireContentEditor();
  await setMemberStatus(userId, "REJECTED");
  revalidatePath("/admin/users");
}

/** Block an approved member — locks them out immediately (setMemberStatus is
   re-checked against the DB on every member request). */
export async function blockMember(userId: number) {
  await requireContentEditor();
  await setMemberStatus(userId, "BLOCKED");
  revalidatePath("/admin/users");
}

/** Unblock a blocked member — restores them straight to APPROVED. */
export async function unblockMember(userId: number) {
  await requireContentEditor();
  await setMemberStatus(userId, "APPROVED");
  revalidatePath("/admin/users");
}

/** Count of brand/creator registrations awaiting review — drives the sidebar
   badge. Server Actions are reachable via direct POST, not just through the
   UI — re-verify authz here too even though every caller is already staff. */
export async function getPendingCount(): Promise<number> {
  await requireUser();
  return prisma.user.count({
    where: { role: { in: ["BRAND", "CREATOR"] }, status: "PENDING" },
  });
}
