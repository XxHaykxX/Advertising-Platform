"use server";

import { loadCurrentUser } from "@/lib/auth/require";
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

/** Client-callable notification actions (#25 / V9). Every one resolves the
 *  current session user via loadCurrentUser() (any active role — staff or
 *  member) and scopes to their own rows, so a client can only touch its own
 *  notifications. Listing is done in server components directly; these cover
 *  the interactive badge + mark-read. */

export async function getUnreadNotificationCount(): Promise<number> {
  const user = await loadCurrentUser();
  if (!user) return 0;
  return getUnreadCount(user.id);
}

/** Recent unread notifications for the live toaster (polled client-side). */
export async function getUnreadNotificationsPreview(): Promise<UnreadNotificationPreview[]> {
  const user = await loadCurrentUser();
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

export async function markNotificationRead(id: number): Promise<{ ok: boolean }> {
  const user = await loadCurrentUser();
  if (!user) return { ok: false };
  await markRead(id, user.id);
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const user = await loadCurrentUser();
  if (!user) return { ok: false };
  await markAllRead(user.id);
  return { ok: true };
}
