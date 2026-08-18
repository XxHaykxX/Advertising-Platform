"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireInterestHandler } from "@/lib/auth/require";
import { canHandleInterests } from "@/lib/auth/permissions";

export type CallRequestActionState = { ok: boolean; error?: string };

/** Marks one call-back lead as handled — same guard as the Offers section
   (canHandleInterests): a call request is answered by the same staff. */
export async function markCallRequestHandled(id: number): Promise<CallRequestActionState> {
  await requireInterestHandler();
  await prisma.callRequest.update({ where: { id }, data: { handledAt: new Date() } });
  revalidatePath("/admin/call-requests");
  return { ok: true };
}

/** Count of call-back leads nobody has marked handled — drives the admin-nav
   badge, same pattern as interests/actions.ts getPendingOfferCount. */
export async function getPendingCallRequestCount(): Promise<number> {
  const user = await requireUser();
  if (!canHandleInterests(user.role)) return 0;
  return prisma.callRequest.count({ where: { handledAt: null } });
}
