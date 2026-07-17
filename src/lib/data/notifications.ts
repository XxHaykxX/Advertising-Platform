import "server-only";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import type { NotificationData, NotificationType } from "@/lib/notifications";

/** Notification data layer (#25 / V9). Creation helpers are called from the
 *  event sites (interest expressed, project submitted/approved/rejected); the
 *  read helpers back the cabinet notification pages + unread badges. */

type NewNotification = {
  type: NotificationType;
  data?: NotificationData;
  link?: string;
};

/** Create one notification for a single recipient. Never throws to the caller's
 *  critical path — callers wrap in try/catch, but we also swallow here so a
 *  notification failure can't roll back the primary action (interest, approval). */
export async function createNotification(
  userId: number,
  n: NewNotification,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: n.type,
        data: n.data ? JSON.stringify(n.data) : null,
        link: n.link ?? "",
      },
    });
  } catch (err) {
    console.error("[notifications] create failed:", err);
  }
}

/** Fan-out to every active user holding one of `roles`, optionally excluding one
 *  user id (so the actor doesn't notify themselves). Used for admin/moderator
 *  broadcasts (new submission, new interest). */
export async function notifyRoles(
  roles: Role[],
  n: NewNotification,
  excludeUserId?: number,
): Promise<void> {
  try {
    const recipients = await prisma.user.findMany({
      where: {
        role: { in: roles },
        isActive: true,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });
    if (recipients.length === 0) return;
    const dataStr = n.data ? JSON.stringify(n.data) : null;
    await prisma.notification.createMany({
      data: recipients.map((r) => ({
        userId: r.id,
        type: n.type,
        data: dataStr,
        link: n.link ?? "",
      })),
    });
  } catch (err) {
    console.error("[notifications] notifyRoles failed:", err);
  }
}

export async function getNotifications(userId: number, limit = 30) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(userId: number): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}

/** Mark a single notification read — scoped to the owner so a user can't flip
 *  another user's rows. Returns silently if the id isn't theirs. */
export async function markRead(notificationId: number, userId: number): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllRead(userId: number): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
