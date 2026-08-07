"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require";
import { canHandleInterests } from "@/lib/auth/permissions";

/** Count of brand offers still waiting for an answer — drives the admin-nav
   badge, same pattern as moderation/actions.ts getPendingModerationCount.
   The section had no badge at all, so a new offer arrived silently and sat
   unanswered until someone happened to open the page. Scoped like the section
   itself (2026-08-07): superadmins and moderators, counting every waiting
   application — the per-owner narrowing dated from when a staff member could
   own the project, which creators do now. */
export async function getPendingOfferCount(): Promise<number> {
  const user = await requireUser();
  if (!canHandleInterests(user.role)) return 0;
  return prisma.interest.count({ where: { status: "SENT" } });
}
