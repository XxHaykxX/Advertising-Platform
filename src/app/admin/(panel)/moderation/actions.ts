"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModerator, requireUser } from "@/lib/auth/require";
import { notifyProjectApproved, notifyProjectRejected } from "@/lib/mail";
import { createNotification } from "@/lib/data/notifications";

/* #13: project-level moderation. Accounts self-approve on registration (see
   lib/auth/members.ts) — what actually gates the public catalog is each
   Project's moderationStatus. A Creator's submitted project (task #16) lands
   here as PENDING; a moderator/superadmin approves or rejects it. */

function revalidateModerationPaths(projectId?: number) {
  // Same two-arg stale-while-revalidate form as projects/actions.ts
  // (revalidateProjectPaths) — an immediate blocking expire crashed an
  // in-flight client navigation on 2026-07-15; "max" avoids that.
  revalidateTag("projects", "max");
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/projects");
  if (projectId) revalidatePath(`/reports/${projectId}`);
}

/** Approve a PENDING/REJECTED project — publishes it to the public catalog.
   Approval is treated as publication: moderationStatus flips to APPROVED and
   isActive is forced true, so the project appears on the next catalog read. */
export async function approveProject(projectId: number) {
  await requireModerator();
  const before = await prisma.project.findUnique({
    where: { id: projectId },
    select: { moderationStatus: true },
  });
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { moderationStatus: "APPROVED", isActive: true },
    select: { id: true, title: true, ownerId: true, owner: { select: { email: true } } },
  });
  // #22: notify the owning Creator, but only on an actual status change —
  // re-approving an already-APPROVED project (e.g. an edit re-save) shouldn't
  // re-send the email or the in-app notification.
  if (before?.moderationStatus !== "APPROVED") {
    try {
      await notifyProjectApproved(project, project.owner.email);
    } catch (err) {
      console.error("[moderation] failed to send approval email:", err);
    }
    await createNotification(project.ownerId, {
      type: "PROJECT_APPROVED",
      data: { projectId: project.id, projectTitle: project.title },
      link: `/reports/${project.id}`,
    });
  }
  revalidateModerationPaths(project.id);
}

/** Reject a PENDING project — keeps it out of the public catalog. The
   `reason` is accepted for the future notification email (#22) but not
   persisted yet — there's no column for it on Project. */
export async function rejectProject(projectId: number, reason?: string) {
  await requireModerator();
  const before = await prisma.project.findUnique({
    where: { id: projectId },
    select: { moderationStatus: true },
  });
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { moderationStatus: "REJECTED" },
    select: { id: true, title: true, ownerId: true, owner: { select: { email: true } } },
  });
  void reason; // accepted for a future richer template — no column to persist it yet
  if (before?.moderationStatus !== "REJECTED") {
    try {
      await notifyProjectRejected(project, project.owner.email);
    } catch (err) {
      console.error("[moderation] failed to send rejection email:", err);
    }
    await createNotification(project.ownerId, {
      type: "PROJECT_REJECTED",
      data: { projectId: project.id, projectTitle: project.title },
      link: "/account/projects",
    });
  }
  revalidateModerationPaths(project.id);
}

/** Count of projects awaiting moderation — drives the admin-nav badge, same
   pattern as registrations/actions.ts getPendingCount. */
export async function getPendingModerationCount(): Promise<number> {
  await requireUser();
  return prisma.project.count({ where: { moderationStatus: "PENDING" } });
}
