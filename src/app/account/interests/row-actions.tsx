"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, X } from "lucide-react";
import { respondToInterest } from "@/lib/actions/interest-response";
import { NoteDialog } from "@/components/note-dialog";
import type { InterestStatus } from "@prisma/client";

const baseCls =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
const acceptCls = `${baseCls} bg-primary text-primary-foreground`;
const declineCls = `${baseCls} bg-danger text-white`;

/** Accept/Decline buttons for one offer in the creator's own inbox. Same
   respondToInterest() call and shape as the admin copy at
   admin/(panel)/interests/row-actions.tsx — kept as a separate file because
   the two live in different auth zones (staff vs. member), not because the
   logic differs. */
export function RowActions({
  interestId,
  status,
  acceptLabel,
  declineLabel,
  answerPrompt,
  dialogLabels,
}: {
  interestId: number;
  status: InterestStatus;
  acceptLabel: string;
  declineLabel: string;
  answerPrompt: string;
  /** Localized copy for the confirm dialog — this cabinet, unlike the admin
   *  panel, follows the visitor's language. */
  dialogLabels: {
    titleAccept: string;
    titleDecline: string;
    notePlaceholder: string;
    cancel: string;
  };
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<boolean | null>(null);

  if (status !== "SENT") return null;

  function respond(accept: boolean, note: string) {
    start(async () => {
      setError("");
      const result = await respondToInterest(interestId, accept, note);
      if (!result.ok) setError(result.error);
      else setConfirming(null);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => setConfirming(true)} className={acceptCls}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {acceptLabel}
        </button>
        <button type="button" disabled={pending} onClick={() => setConfirming(false)} className={declineCls}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          {declineLabel}
        </button>
      </div>
      {error ? (
        <p className="max-w-md rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs leading-relaxed text-danger">
          {error}
        </p>
      ) : null}

      {confirming !== null ? (
        <NoteDialog
          accept={confirming}
          pending={pending}
          labels={{
            titleAccept: dialogLabels.titleAccept,
            titleDecline: dialogLabels.titleDecline,
            noteLabel: answerPrompt,
            notePlaceholder: dialogLabels.notePlaceholder,
            confirmAccept: acceptLabel,
            confirmDecline: declineLabel,
            cancel: dialogLabels.cancel,
          }}
          onConfirm={(note) => respond(confirming, note)}
          onClose={() => setConfirming(null)}
        />
      ) : null}
    </div>
  );
}
