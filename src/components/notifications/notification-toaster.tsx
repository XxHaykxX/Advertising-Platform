"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Heart, Megaphone, X } from "lucide-react";
import { makeUI, type Locale } from "@/lib/i18n";
import { renderNotification, parseNotificationData } from "@/lib/notifications";
import { getUnreadNotificationsPreview, markNotificationRead } from "@/lib/actions/notifications";

type Toast = { id: number; title: string; body: string; url: string; type: string };

const STORAGE_KEY = "igovazd:toastedNotifIds";
const POLL_MS = 10_000;
const AUTO_DISMISS_MS = 6500;

const ICONS: Record<string, typeof Bell> = {
  BROADCAST: Megaphone,
  INTEREST: Heart,
};

/** Live in-app notification toaster (#push). Polls the server every ~10s for
 *  unread notifications and pops a styled slide-in toast for any it hasn't shown
 *  before (tracked in localStorage so a toast fires once, not on every poll or
 *  reload). Complements the real Web Push (which covers the site-closed case) —
 *  this is the pretty in-app version while a tab is open. Mounted in the cabinet
 *  layout for signed-in members. */
export function NotificationToaster({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef<Set<number>>(new Set());
  const seeded = useRef(false);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    // Seed the "already toasted" set from localStorage so a reload doesn't
    // re-pop notifications the user has already seen toast for.
    if (!seeded.current) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) JSON.parse(raw).forEach((n: number) => seen.current.add(n));
      } catch {
        /* ignore */
      }
      seeded.current = true;
    }

    const t = makeUI(locale);
    let alive = true;

    async function poll() {
      let rows;
      try {
        rows = await getUnreadNotificationsPreview();
      } catch {
        return;
      }
      if (!alive) return;
      const fresh = rows.filter((r) => !seen.current.has(r.id));
      if (fresh.length === 0) return;

      fresh.forEach((r) => seen.current.add(r.id));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen.current].slice(-300)));
      } catch {
        /* ignore */
      }

      // Oldest first so newer toasts stack on top.
      const next = [...fresh].reverse().map((r) => {
        const { title, body } = renderNotification(t, r.type, parseNotificationData(r.data));
        return { id: r.id, title, body, url: r.link || "", type: r.type };
      });
      setToasts((prev) => [...prev, ...next]);
    }

    void poll();
    const iv = setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [locale]);

  function open(toast: Toast) {
    void markNotificationRead(toast.id);
    remove(toast.id);
    if (toast.url) router.push(toast.url);
  }

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[60] flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onOpen={() => open(toast)} onDismiss={() => remove(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onOpen,
  onDismiss,
}: {
  toast: Toast;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const [shown, setShown] = useState(false);
  const Icon = ICONS[toast.type] ?? Bell;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg shadow-black/10 transition-all duration-300 ${
        shown ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
      }`}
    >
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-semibold text-foreground">{toast.title}</span>
        {toast.body && <span className="mt-0.5 block text-sm text-muted-foreground">{toast.body}</span>}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Close"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
