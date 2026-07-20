"use server";

import { loadCurrentUser } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";

/** Client-callable Web Push subscription actions (#push). The browser subscribes
 *  via PushManager then posts the subscription here; we store one row per
 *  endpoint scoped to the current user. Endpoints are long → the column is TEXT
 *  with no unique index, so we dedup by deleting any existing row with the same
 *  endpoint before inserting. */

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function savePushSubscription(sub: PushSubscriptionInput): Promise<{ ok: boolean }> {
  const user = await loadCurrentUser();
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

export async function deletePushSubscription(endpoint: string): Promise<{ ok: boolean }> {
  const user = await loadCurrentUser();
  if (!user) return { ok: false };
  try {
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
  } catch {
    return { ok: false };
  }
  return { ok: true };
}
