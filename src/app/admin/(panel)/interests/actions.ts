"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require";
import { canEditContent } from "@/lib/auth/permissions";

/** Count of brand offers still waiting for an answer — drives the admin-nav
   badge, same pattern as moderation/actions.ts getPendingModerationCount.
   The section had no badge at all, so a new offer arrived silently and sat
   unanswered until someone happened to open the page. Scoped like the
   section itself: a Publisher only counts offers on their own projects. */
export async function getPendingOfferCount(): Promise<number> {
  const user = await requireUser();
  if (!canEditContent(user.role)) return 0;
  return prisma.interest.count({
    where: {
      status: "SENT",
      ...(user.role === "SUPERADMIN" ? {} : { project: { ownerId: user.id } }),
    },
  });
}
