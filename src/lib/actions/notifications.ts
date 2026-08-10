"use server";

import { loadStaffUser, loadCurrentMember } from "@/lib/auth/require";
import {
  getUnreadCount,
  getUnreadNotifications,
  markRead,
  markAllRead,
} from "@/lib/data/notifications";

export type UnreadNotificationPreview = {
  id: number;
  type: string;
  data: string | null;
  link: string;
  createdAt: string;
};

/** Which cabinet is calling — a browser can hold both a staff and a member
 *  session cookie at once (IA-47), so there's no "the" current user for a
 *  shared action; the caller has to say whose page it's on. Every export
 *  below takes this instead of loadCurrentUser() (#63/QA-10): that helper
 *  prefers staff unconditionally, which used to leak the staff account's
 *  unread notifications — and mark-read/mark-all-read writes — onto the
 *  member cabinet's badge/toaster whenever both cookies were present. The
 *  scope only picks which already-cookie-verified loader runs, so a caller
 *  can't use it to impersonate a session it doesn't actually hold. */
export type NotificationScope = "member" | "staff";

async function resolveUser(scope: NotificationScope) {
  return scope === "staff" ? loadStaffUser() : loadCurrentMember();
}

export async function getUnreadNotificationCount(scope: NotificationScope): Promise<number> {
  const user = await resolveUser(scope);
  if (!user) return 0;
  return getUnreadCount(user.id);
}

/** Recent unread notifications for the live toaster (polled client-side). */
export async function getUnreadNotificationsPreview(
  scope: NotificationScope,
): Promise<UnreadNotificationPreview[]> {
  const user = await resolveUser(scope);
  if (!user) return [];
  const rows = await getUnreadNotifications(user.id, 5);
  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    data: n.data,
    link: n.link,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function markNotificationRead(id: number, scope: NotificationScope): Promise<{ ok: boolean }> {
  const user = await resolveUser(scope);
  if (!user) return { ok: false };
  await markRead(id, user.id);
  return { ok: true };
}

export async function markAllNotificationsRead(scope: NotificationScope): Promise<{ ok: boolean }> {
  const user = await resolveUser(scope);
  if (!user) return { ok: false };
  await markAllRead(user.id);
  return { ok: true };
}
