"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { respondToInterest } from "@/lib/actions/interest-response";
import type { InterestStatus } from "@prisma/client";

const btnCls =
  "inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

/** Accept/Decline buttons for one application row — same useTransition +
   bound-Server-Action shape as moderation/registrations row-actions, but
   calling respondToInterest() (audit 2.2), the exact action /account/interests
   uses too. Hidden once the application already has an answer: MUTUAL/DECLINED
   is final, nothing left to click. */
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

  if (status !== "SENT") return null;

  function respond(accept: boolean) {
    // The note is the creator's own words, reaching the brand via cabinet,
    // notification and email — optional, like the reject-reason prompt in
    // moderation/row-actions.
    const note = window.prompt(answerPrompt) ?? "";
    start(async () => {
      setError("");
      const result = await respondToInterest(interestId, accept, note);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => respond(true)} className={btnCls}>
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {acceptLabel}
        </button>
        <button type="button" disabled={pending} onClick={() => respond(false)} className={btnCls}>
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {declineLabel}
        </button>
      </div>
      {error ? (
        <p className="max-w-md rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs leading-relaxed text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
