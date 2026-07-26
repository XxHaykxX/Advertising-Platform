"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, X } from "lucide-react";

/** A yes/no answer that carries a written note — accepting or declining a
 *  brand offer, rejecting a submitted project. Replaces window.prompt(),
 *  which was a plain grey OS box dropped in the middle of the panel: nothing
 *  to do with the rest of the design, no room for a multi-line note, and its
 *  Cancel button used to send the answer anyway. These answers are
 *  irreversible — they flip a status, book or free a package slot, and email
 *  the other side — so they deserve a deliberate step that looks like the
 *  product.
 *
 *  Shape mirrors ApplicationDialog (report/application-dialog.tsx): a fixed
 *  overlay with role="dialog", backdrop click and Escape to dismiss. Labels
 *  arrive as props because the admin panel is English-only while the
 *  creator's cabinet is localized. */
export function NoteDialog({
  accept,
  pending,
  labels,
  onConfirm,
  onClose,
}: {
  /** true → Accept (primary), false → Decline (danger). */
  accept: boolean;
  pending: boolean;
  labels: {
    titleAccept: string;
    titleDecline: string;
    noteLabel: string;
    notePlaceholder: string;
    confirmAccept: string;
    confirmDecline: string;
    cancel: string;
  };
  onConfirm: (note: string) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-base font-bold text-foreground">
          {accept ? labels.titleAccept : labels.titleDecline}
        </h2>

        <label
          htmlFor="respond-note"
          className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {labels.noteLabel}
        </label>
        <textarea
          id="respond-note"
          rows={4}
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={labels.notePlaceholder}
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="flex-1 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            {labels.cancel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(note)}
            disabled={pending}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 ${
              accept ? "bg-primary text-primary-foreground" : "bg-danger text-white"
            }`}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : accept ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {accept ? labels.confirmAccept : labels.confirmDecline}
          </button>
        </div>
      </div>
    </div>
  );
}
