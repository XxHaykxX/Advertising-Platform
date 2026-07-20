"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Heart, Clapperboard, CheckCircle2, XCircle, CheckCheck, Megaphone } from "lucide-react";
import { makeUI, type Locale } from "@/lib/i18n";
import {
  renderNotification,
  parseNotificationData,
} from "@/lib/notifications";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

export type NotificationItem = {
  id: number;
  type: string;
  data: string | null;
  link: string;
  read: boolean;
  createdAt: string; // ISO string
};

const ICONS: Record<string, typeof Bell> = {
  INTEREST: Heart,
  PROJECT_SUBMITTED: Clapperboard,
  PROJECT_APPROVED: CheckCircle2,
  PROJECT_REJECTED: XCircle,
  BROADCAST: Megaphone,
};

/** Shared notification feed for all three cabinets (brand / creator / admin).
 *  Rows are localized at render from type+data (never stored translated).
 *  Clicking a row marks it read and navigates to its in-app link; the header
 *  has a "mark all read" action. Optimistic local state keeps the UI snappy;
 *  router.refresh() reconciles the server-rendered badge/count. */
export function NotificationList({
  items: initial,
  locale,
}: {
  items: NotificationItem[];
  locale: Locale;
}) {
  const t = makeUI(locale);
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [, startTransition] = useTransition();

  const hasUnread = items.some((n) => !n.read);
  const dtf = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  function open(n: NotificationItem) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      startTransition(async () => {
        await markNotificationRead(n.id);
        router.refresh();
      });
    }
    if (n.link) router.push(n.link);
  }

  function markAll() {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
        <Bell className="mb-3 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{t("notif.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={markAll}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {t("notif.markAllRead")}
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((n) => {
          const { title, body } = renderNotification(t, n.type, parseNotificationData(n.data));
          const Icon = ICONS[n.type] ?? Bell;
          return (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => open(n)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  n.read
                    ? "border-border bg-background hover:bg-muted/50"
                    : "border-primary/30 bg-primary/5 hover:bg-primary/10",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full",
                    n.read ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{title}</span>
                    {!n.read && (
                      <span className="grid place-items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-primary-foreground">
                        {t("notif.new")}
                      </span>
                    )}
                  </span>
                  {body && <span className="mt-0.5 block text-sm text-muted-foreground">{body}</span>}
                  <span className="mt-1 block text-xs text-muted-foreground/70">
                    {dtf.format(new Date(n.createdAt))}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
