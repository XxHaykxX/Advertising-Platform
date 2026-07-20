"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Loader2, X } from "lucide-react";
import { makeUI, type Locale } from "@/lib/i18n";
import { savePushSubscription } from "@/lib/actions/push";

type Status = "loading" | "unsupported" | "prompt" | "enabled" | "denied";

/** Converts the URL-base64 VAPID public key to the Uint8Array the PushManager
 *  wants for applicationServerKey. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** Floating "enable browser notifications" prompt (#push). Registers the
 *  service worker, asks the browser for permission, subscribes via the Push API
 *  and stores the subscription server-side so the user gets real system push —
 *  even with the site closed / on their phone. Renders nothing when unsupported,
 *  already enabled, or dismissed. Shown only to signed-in users (mounted in the
 *  cabinet layout). */
export function PushSubscribe({ locale }: { locale: Locale }) {
  const t = makeUI(locale);
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let alive = true;
    async function init() {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window &&
        !!VAPID_PUBLIC_KEY;
      if (!supported) {
        if (alive) setStatus("unsupported");
        return;
      }
      try {
        await navigator.serviceWorker.register("/sw.js");
        const reg = await navigator.serviceWorker.ready;
        if (Notification.permission === "denied") {
          if (alive) setStatus("denied");
          return;
        }
        const existing = await reg.pushManager.getSubscription();
        if (existing && Notification.permission === "granted") {
          // Re-persist quietly in case the row was pruned server-side.
          const json = existing.toJSON();
          if (json.endpoint && json.keys) {
            void savePushSubscription({
              endpoint: json.endpoint,
              keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
            });
          }
          if (alive) setStatus("enabled");
          return;
        }
        if (alive) setStatus("prompt");
      } catch {
        if (alive) setStatus("unsupported");
      }
    }
    void init();
    return () => {
      alive = false;
    };
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "denied" : "prompt");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
      const json = sub.toJSON();
      if (json.endpoint && json.keys) {
        const res = await savePushSubscription({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        });
        setStatus(res.ok ? "enabled" : "prompt");
      }
    } catch {
      setStatus("prompt");
    } finally {
      setBusy(false);
    }
  }

  if (status !== "prompt" || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-border bg-card p-3 pr-2 shadow-lg shadow-black/10">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <BellRing className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{t("push.title")}</p>
        <p className="text-xs text-muted-foreground">{t("push.subtitle")}</p>
      </div>
      <button
        type="button"
        onClick={enable}
        disabled={busy}
        className="ml-1 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
        {t("push.enable")}
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t("ui.close")}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
