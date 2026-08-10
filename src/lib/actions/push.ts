"use server";

import { loadStaffUser, loadCurrentMember } from "@/lib/auth/require";
import type { NotificationScope } from "@/lib/actions/notifications";
import { prisma } from "@/lib/prisma";

/** Client-callable Web Push subscription actions (#push). The browser subscribes
 *  via PushManager then posts the subscription here; we store one row per
 *  endpoint scoped to the current user. Endpoints are long → the column is TEXT
 *  with no unique index, so we dedup by deleting any existing row with the same
 *  endpoint before inserting.
 *
 *  Takes the same NotificationScope the caller does (#63/QA-10): PushSubscribe
 *  is mounted in both the member cabinet and the staff panel layouts, and this
 *  used to resolve "whoever's cookie" via loadCurrentUser() — staff-always-wins
 *  — so a member's browser that also held a staff cookie registered its push
 *  endpoint under the STAFF account. Every future staff notification then
 *  pushed to that browser regardless of which cabinet was open in it. */
async function resolveUser(scope: NotificationScope) {
  return scope === "staff" ? loadStaffUser() : loadCurrentMember();
}

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function savePushSubscription(
  sub: PushSubscriptionInput,
  scope: NotificationScope,
): Promise<{ ok: boolean }> {
  const user = await resolveUser(scope);
  if (!user) return { ok: false };
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false };

  try {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
    await prisma.pushSubscription.create({
      data: {
        userId: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
    });
  } catch (err) {
    console.error("[push] save subscription failed:", err);
    return { ok: false };
  }
  return { ok: true };
}

export async function deletePushSubscription(
  endpoint: string,
  scope: NotificationScope,
): Promise<{ ok: boolean }> {
  const user = await resolveUser(scope);
  if (!user) return { ok: false };
  try {
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
  } catch {
    return { ok: false };
  }
  return { ok: true };
}
