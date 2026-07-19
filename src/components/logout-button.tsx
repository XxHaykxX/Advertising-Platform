"use client";

import { useEffect, useState, useTransition, type ButtonHTMLAttributes } from "react";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

/** Client-side logout trigger. Replaces `<form action={logout}>` — the
 *  server action just clears the cookie and reports where to go; navigation
 *  happens here with a fresh full request so it survives Hostinger/Passenger
 *  (see account/actions.ts and admin/actions.ts for why). Shows a Yes/No
 *  confirmation popup before actually signing out (IA-10). */
export function LogoutButton({
  action,
  onClick,
  locale = DEFAULT_LOCALE,
  ...props
}: {
  action: () => Promise<{ redirect: string }>;
  locale?: Locale;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "action">) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const t = makeUI(locale);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(e);
    setConfirmOpen(true);
  }

  function doLogout() {
    setConfirmOpen(false);
    startTransition(async () => {
      try {
        const res = await action();
        window.location.assign(res.redirect);
      } catch {
        // Action rejected (network / 500). The cookie may or may not have
        // cleared server-side; reload so the app re-evaluates auth state
        // instead of leaving the button stuck disabled with no feedback.
        window.location.reload();
      }
    });
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={pending} {...props} />
      {confirmOpen && (
        <LogoutConfirmDialog
          t={t}
          onConfirm={doLogout}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}

/** Minimal accessible confirm popup — overlay + box + Yes/No. Escape or
 *  clicking the backdrop counts as "No" and just closes it. */
function LogoutConfirmDialog({
  t,
  onConfirm,
  onCancel,
}: {
  t: ReturnType<typeof makeUI>;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 id="logout-confirm-title" className="text-base font-bold text-foreground">
          {t("logout.confirmTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("logout.confirmMessage")}</p>
        <div className="mt-6 flex items-center gap-3">
          <Button type="button" variant="secondary" className="flex-1" autoFocus onClick={onCancel}>
            {t("logout.confirmNo")}
          </Button>
          <Button type="button" variant="primary" className="flex-1" onClick={onConfirm}>
            {t("logout.confirmYes")}
          </Button>
        </div>
      </div>
    </div>
  );
}
