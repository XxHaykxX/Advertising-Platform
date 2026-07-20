import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

/** Web Push sender (#push, 2026-07-20). Delivers a system notification to every
 *  browser/device a user subscribed from, even when the site is closed — the
 *  browser's push service + the site's service worker (public/sw.js) handle it.
 *  A no-op when VAPID keys aren't configured, so local/dev without keys is safe. */

let configured: boolean | null = null;

function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@igovazd.am";
  if (!publicKey || !privateKey) {
    console.warn("[web-push] VAPID keys missing — push disabled");
    configured = false;
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type PushPayload = { title: string; body: string; url?: string };

/** Send one payload to all of a user's subscriptions. Prunes endpoints the push
 *  service reports as gone (404/410). Never throws — best-effort alongside the
 *  in-app notification that was already persisted. */
export async function sendWebPush(userId: number, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;
  let subs;
  try {
    subs = await prisma.pushSubscription.findMany({ where: { userId } });
  } catch (err) {
    console.error("[web-push] load subscriptions failed:", err);
    return;
  }
  if (subs.length === 0) return;

  const json = JSON.stringify(payload);
  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          json,
        );
      } catch (err) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          // Subscription expired/unsubscribed — drop it so we stop trying.
          await prisma.pushSubscription.deleteMany({ where: { id: s.id } }).catch(() => {});
        } else {
          console.error("[web-push] send failed:", code ?? err);
        }
      }
    }),
  );
}

/** Fan a payload out to many users (broadcast). */
export async function sendWebPushToMany(userIds: number[], payload: PushPayload): Promise<void> {
  if (!ensureConfigured() || userIds.length === 0) return;
  await Promise.allSettled(userIds.map((id) => sendWebPush(id, payload)));
}
