"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Loader2, X } from "lucide-react";
import { useUI, type Locale } from "@/lib/i18n-client";
import { savePushSubscription } from "@/lib/actions/push";
import type { NotificationScope } from "@/lib/actions/notifications";

type Status = "loading" | "unsupported" | "prompt" | "enabled" | "denied";

/** "No thanks" has to outlive the component. The prompt is mounted by the
 *  cabinet layout, so a dismissal held in state came back on the next
 *  navigation — and the banner is `fixed` bottom-right over the content,
 *  covering a card on every page for an account that will never enable push.
 *  Kept per browser and per scope (a staff panel and a member cabinet can be
 *  open in the same browser under independent cookies). */
const DISMISS_KEY = "pushPromptDismissed";

function isDismissed(scope: string): boolean {
  try {
    return localStorage.getItem(`${DISMISS_KEY}:${scope}`) === "1";
  } catch {
    return false;
  }
}

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

/** Floating "enable browser notifications" prompt (#push). Registers the
 *  service worker, asks the browser for permission, subscribes via the Push API
 *  and stores the subscription server-side so the user gets real system push —
 *  even with the site closed / on their phone. Renders nothing when unsupported,
 *  already enabled, or dismissed. Shown only to signed-in users (mounted in the
 *  cabinet layout). The VAPID public key comes in as a prop read at runtime from
 *  the server (process.env.VAPID_PUBLIC_KEY) so enabling push in prod needs only
 *  an env var + restart — no rebuild (unlike a NEXT_PUBLIC build-time inline).
 *  `scope` picks which session the subscription is saved under (#63/QA-10) —
 *  this component is mounted in both the member cabinet and the staff panel
 *  layouts, and the two hold independent cookies that can both be present at
 *  once. */
export function PushSubscribe({
  locale,
  vapidPublicKey,
  scope,
}: {
  locale: Locale;
  vapidPublicKey: string;
  scope: NotificationScope;
}) {
  const t = useUI(locale);
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  // Not a lazy initializer: this component is server-rendered first (it's
  // mounted in a layout), and localStorage doesn't exist there.
  const [dismissed, setDismissed] = useState(false);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(`${DISMISS_KEY}:${scope}`, "1");
    } catch {
      // Private mode / storage disabled — dismissing for this page is still
      // better than ignoring the click.
    }
  }

  useEffect(() => {
    let alive = true;
    async function init() {
      if (isDismissed(scope)) {
        if (alive) setDismissed(true);
        return;
      }
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window &&
        !!vapidPublicKey;
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
            void savePushSubscription(
              { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } },
              scope,
            );
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
  }, [scope, vapidPublicKey]);

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
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
      const json = sub.toJSON();
      if (json.endpoint && json.keys) {
        const res = await savePushSubscription(
          { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } },
          scope,
        );
        setStatus(res.ok ? "enabled" : "prompt");
      }
    } catch {
      setStatus("prompt");
    } finally {
      setBusy(false);
    }
  }

  if (dismissed) return null;

  // Browser-level block. Nothing here can undo it — only the site settings
  // can — but staying silent is worse: the account simply never hears about
  // a new offer and has no idea why. Push is meant to reach every kind of
  // account (staff, brands, creators), so say what's wrong.
  if (status === "denied") {
    return (
      <div className="fixed bottom-[calc(1rem+var(--offer-bar-h,0px))] right-4 z-50 flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl border border-warn/40 bg-card p-3 pr-2 shadow-lg shadow-black/10">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warn/10 text-warn">
          <BellRing className="h-5 w-5" />
        </span>
        <div className="min-w-0 max-w-xs">
          <p className="text-sm font-semibold text-foreground">{t("push.blockedTitle")}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{t("push.blockedBody")}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("ui.close")}
          className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (status !== "prompt") return null;

  return (
    <div className="fixed bottom-[calc(1rem+var(--offer-bar-h,0px))] right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-border bg-card p-3 pr-2 shadow-lg shadow-black/10">
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
        onClick={dismiss}
        aria-label={t("ui.close")}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
