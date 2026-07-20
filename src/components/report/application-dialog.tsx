"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitApplication } from "@/app/account/brand/actions";
import type { makeUI } from "@/lib/i18n";

/** Application popup (#23) for the report page's Express Interest button —
 *  same accessible-overlay shape as LogoutConfirmDialog (logout-button.tsx):
 *  role="dialog" + backdrop click / Escape to close. On success it shows the
 *  apply.success state in place of the form (manual Close, no auto-dismiss
 *  timer) and calls onSubmitted so the caller can flip the button to its
 *  "already applied" state right away — the dialog itself only closes when
 *  the brand dismisses it. */
export function ApplicationDialog({
  projectId,
  t,
  onClose,
  onSubmitted,
}: {
  projectId: number;
  t: ReturnType<typeof makeUI>;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitApplication(projectId, message, contact);
      if (!res.ok) {
        setError(res.error ?? t("apply.error"));
        return;
      }
      onSubmitted();
      setSent(true);
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-dialog-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 id="apply-dialog-title" className="text-base font-bold text-foreground">
          {t("apply.title")}
        </h2>

        {sent ? (
          <>
            <p className="mt-4 text-sm text-foreground">{t("apply.success")}</p>
            <div className="mt-6 flex justify-end">
              <Button type="button" variant="primary" onClick={onClose}>
                {t("apply.cancel")}
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div>
              <label htmlFor="apply-message" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("apply.messageLabel")}
              </label>
              <textarea
                id="apply-message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("apply.messagePlaceholder")}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="apply-contact" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("apply.contactLabel")}
              </label>
              <input
                id="apply-contact"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={t("apply.contactPlaceholder")}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            {error ? <p className="text-xs text-danger">{error}</p> : null}

            <div className="mt-2 flex items-center gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={pending}>
                {t("apply.cancel")}
              </Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={pending || !message.trim()}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("apply.submit")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
