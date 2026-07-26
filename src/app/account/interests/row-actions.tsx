"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { respondToInterest } from "@/lib/actions/interest-response";
import type { InterestStatus } from "@prisma/client";

const btnCls =
  "inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

/** Accept/Decline buttons for one application in the creator's own inbox.
   Same respondToInterest() call and shape as the admin copy at
   admin/(panel)/interests/row-actions.tsx — kept as a separate file because
   the two live in different auth zones (staff vs. member), not because the
   logic differs. */
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
