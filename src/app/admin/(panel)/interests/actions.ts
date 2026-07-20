"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { createNotification } from "@/lib/data/notifications";

/* #24 — admin decision on a brand's Interest. Both actions load the interest
 * fresh (need brandId + project title for the notification), flip status,
 * notify the brand, and revalidate the list. A notification failure never
 * fails the decision — createNotification already swallows its own errors. */

export type InterestDecisionResult = { ok: true } | { ok: false; error: string };

async function decide(
  interestId: number,
  status: "MUTUAL" | "DECLINED",
  notifType: "INTEREST_APPROVED" | "INTEREST_DECLINED",
): Promise<InterestDecisionResult> {
  await requireSuperadmin();

  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: { project: { select: { title: true } } },
  });
  if (!interest) return { ok: false, error: "Not found" };

  await prisma.interest.update({ where: { id: interestId }, data: { status } });

  await createNotification(interest.brandId, {
    type: notifType,
    data: { projectId: interest.projectId, projectTitle: interest.project.title },
    link: "/account/brand/interests",
  });

  revalidatePath("/admin/interests");
  return { ok: true };
}

export async function approveInterest(interestId: number): Promise<InterestDecisionResult> {
  return decide(interestId, "MUTUAL", "INTEREST_APPROVED");
}

export async function declineInterest(interestId: number): Promise<InterestDecisionResult> {
  return decide(interestId, "DECLINED", "INTEREST_DECLINED");
}
