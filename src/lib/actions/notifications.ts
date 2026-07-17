"use server";

import { loadCurrentUser } from "@/lib/auth/require";
import {
  getUnreadCount,
  markRead,
  markAllRead,
} from "@/lib/data/notifications";

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
