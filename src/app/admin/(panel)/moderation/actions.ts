"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModerator, requireUser } from "@/lib/auth/require";
import { recordVersion } from "@/lib/history/record";
import { notifyProjectApproved, notifyProjectRejected } from "@/lib/mail";
import { createNotification } from "@/lib/data/notifications";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { publishBlockers } from "@/app/admin/(panel)/projects/form-shared";

/** JSON string[] (or null) -> string[]; tolerant of malformed data. Mirrors the
   helper in src/lib/data/projects.ts — used here only to tell an empty
   benefits list ("[]") apart from a filled one. */
function parseJsonList(json: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/* #13: project-level moderation. Accounts self-approve on registration (see
   lib/auth/members.ts) — what actually gates the public catalog is each
   Project's moderationStatus. A Creator's submitted project (task #16) lands
   here as PENDING; a moderator/superadmin approves or rejects it. */

function revalidateModerationPaths(projectId?: number) {
  // Same two-arg stale-while-revalidate form as projects/actions.ts
  // (revalidateProjectPaths) — an immediate blocking expire crashed an
  // in-flight client navigation on 2026-07-15; "max" avoids that.
  updateTag("projects");
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/projects");
  if (projectId) revalidatePath(`/reports/${projectId}`);
}

/** Approve a PENDING/REJECTED project — publishes it to the public catalog.
   Approval is treated as publication: moderationStatus flips to APPROVED and
   isActive is forced true, so the project appears on the next catalog read.

   Returns { error } instead of publishing when the project is missing anything
   the owner marked required for publication (audit 2.8: a project with no
   placement package used to pass moderation and land in the catalog with
   nothing for a brand to buy). */
export async function approveProject(projectId: number): Promise<{ ok: true } | { error: string }> {
  const user = await requireModerator();
  const before = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      moderationStatus: true,
      studio: true,
      tagline: true,
      taglineHy: true,
      taglineRu: true,
      taglineEn: true,
      kind: true,
      episodes: true,
      episodeMinutes: true,
      durationMinutes: true,
      poster: true,
      formatCategory: true,
      applicationDeadline: true,
      applicationDeadlineOngoing: true,
      // Feeds the placements grandfather clause below (PLACEMENTS_REQUIRED_FROM,
      // form-shared.ts) — a re-approval of a pre-existing project must not be
      // refused for a requirement that didn't exist when it was created.
      createdAt: true,
      tiers: { select: { name: true, benefits: true } },
      // Row content is irrelevant here — publishBlockers only needs the count.
      _count: { select: { placements: true } },
    },
  });
  if (!before) return { error: "Project not found." };

  const missing = publishBlockers({
    studio: before.studio,
    tagline: before.tagline || before.taglineHy || before.taglineRu || before.taglineEn || "",
    kind: before.kind,
    episodes: before.episodes,
    episodeMinutes: before.episodeMinutes,
    durationMinutes: before.durationMinutes,
    // `benefits` is a JSON string[]; an empty list serializes to "[]", which
    // publishBlockers must not read as "filled in".
    tiers: before.tiers.map((tier) => ({
      name: tier.name,
      benefits: parseJsonList(tier.benefits).join(""),
    })),
    poster: before.poster,
    placementsCount: before._count.placements,
    formatCategory: before.formatCategory,
    applicationDeadline: before.applicationDeadline,
    applicationDeadlineOngoing: before.applicationDeadlineOngoing,
    createdAt: before.createdAt,
  });
  if (missing.length > 0) {
    const t = makeUI(await getLocale());
    return { error: `${t("publish.blockedApprove")} ${missing.map((key) => t(key)).join(", ")}.` };
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { moderationStatus: "APPROVED", isActive: true, updatedById: user.id },
    select: { id: true, title: true, ownerId: true, owner: { select: { email: true } } },
  });
  await recordVersion(prisma, "Project", project.id, "UPDATE", { id: user.id, name: user.name });
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
  return { ok: true };
}

/** Reject a PENDING project — keeps it out of the public catalog. The moderator's
   `reason` is stored on the project and carried into the rejection email and
   the creator's cabinet. It used to be discarded (`void reason`), so the
   creator got a template letter that never said what to fix (audit 1.4). */
export async function rejectProject(projectId: number, reason?: string) {
  const user = await requireModerator();
  const before = await prisma.project.findUnique({
    where: { id: projectId },
    select: { moderationStatus: true },
  });
  const trimmedReason = (reason || "").trim();
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { moderationStatus: "REJECTED", rejectionReason: trimmedReason || null, updatedById: user.id },
    select: { id: true, title: true, ownerId: true, owner: { select: { email: true } } },
  });
  await recordVersion(prisma, "Project", project.id, "UPDATE", { id: user.id, name: user.name });
  if (before?.moderationStatus !== "REJECTED") {
    try {
      await notifyProjectRejected(project, project.owner.email, trimmedReason);
    } catch (err) {
      console.error("[moderation] failed to send rejection email:", err);
    }
    await createNotification(project.ownerId, {
      type: "PROJECT_REJECTED",
      data: { projectId: project.id, projectTitle: project.title, reason: trimmedReason },
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
