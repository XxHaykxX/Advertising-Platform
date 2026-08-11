"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, X } from "lucide-react";
import { respondToInterest } from "@/lib/actions/interest-response";
import { NoteDialog } from "@/components/note-dialog";
import type { InterestStatus } from "@prisma/client";

const baseCls =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
// Same colour rule as the moderation queue: the affirmative answer carries the
// primary colour, the negative one danger red. Two answers that do opposite,
// irreversible things should not look identical.
const acceptCls = `${baseCls} bg-primary text-primary-foreground`;
const declineCls = `${baseCls} bg-danger text-white`;

/** Accept/Decline buttons for one brand offer — same useTransition +
   bound-Server-Action shape as moderation/registrations row-actions, calling
   respondToInterest() (audit 2.2), which since 2026-08-07 only a staff
   session can call at all. Hidden once the offer already has an answer: MUTUAL/DECLINED is final,
   nothing left to click. */
export function RowActions({
  interestId,
  status,
  acceptLabel,
  declineLabel,
  answerPrompt,
}: {
  interestId: number;
  status: InterestStatus;
  acceptLabel: string;
  declineLabel: string;
  answerPrompt: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  // null → no dialog open; true/false → confirming an accept / a decline.
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
            // Admin panel is English-only (see admin-nav and the other
            // sections, which hardcode English).
            titleAccept: "Accept this offer?",
            titleDecline: "Decline this offer?",
            noteLabel: answerPrompt,
            notePlaceholder: "The brand will see this message",
            confirmAccept: acceptLabel,
            confirmDecline: declineLabel,
            cancel: "Cancel",
          }}
          onConfirm={(note) => respond(confirming, note)}
          onClose={() => setConfirming(null)}
        />
      ) : null}
    </div>
  );
}
