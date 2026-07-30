"use client";

import { useEffect, useRef, useState, useTransition, type ButtonHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useModalDialog } from "@/lib/use-modal-dialog";

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
  // Focus into the dialog, Tab kept inside it, focus back on the trigger when
  // it closes, and the page behind frozen while it is open — see the hook.
  // The hook doesn't handle Escape, so that stays here.
  const panelRef = useRef<HTMLDivElement>(null);
  useModalDialog(panelRef);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  // Portalled to <body>, and that is load-bearing rather than tidiness: every
  // sidebar this button lives in is itself transformed (admin-shell's <aside>
  // carries md:translate-x-0 for the mobile slide-in; the brand and creator
  // sidebars do the same). A transform makes the element the containing block
  // for `position: fixed` descendants, so `fixed inset-0 place-items-center`
  // centred the dialog inside the 15rem sidebar and clipped it against the left
  // edge of the screen instead of centring it on the viewport.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Portalling has a sharp edge, and it bit immediately: this dialog is opened
  // from menus that close themselves on a document-level "click outside"
  // (the header's UserMenu, header.tsx — and the same idiom is used by the
  // currency/locale switchers, MultiSelect and the cast editor). Once the
  // dialog lives under <body> instead of inside the menu, its own buttons ARE
  // "outside" that menu: pressing "Yes, log out" fired mousedown first, the
  // menu closed, this component unmounted with it, and the click never reached
  // the button — signing out from the header silently did nothing.
  //
  // Swallowing mousedown at the dialog root fixes it for every such menu at
  // once, including ones written later, instead of teaching each of them about
  // this dialog. A native listener rather than React's onMouseDown on purpose:
  // React routes portal events through the tree they were rendered in, so a
  // synthetic stopPropagation is not a reliable way to keep the native event
  // from reaching a listener bound directly to `document`.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener("mousedown", stop);
    el.addEventListener("pointerdown", stop);
    return () => {
      el.removeEventListener("mousedown", stop);
      el.removeEventListener("pointerdown", stop);
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={rootRef}
      // data-lenis-prevent: this dialog is reachable from the public header
      // (signed-in members see it there too), and Lenis owns the wheel
      // globally on the public pages — without this a wheel over the dialog
      // scrolls the page underneath instead.
      data-lenis-prevent
      className="fixed inset-0 z-[100] grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl outline-none"
      >
        <h2 id="logout-confirm-title" className="text-base font-bold text-foreground">
          {t("logout.confirmTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("logout.confirmMessage")}</p>
        <div className="mt-6 flex items-center gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
            {t("logout.confirmNo")}
          </Button>
          <Button type="button" variant="primary" className="flex-1" onClick={onConfirm}>
            {t("logout.confirmYes")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
