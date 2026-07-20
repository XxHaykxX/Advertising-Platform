"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { InterestStatus } from "@prisma/client";
import { approveInterest, declineInterest } from "./actions";

const btnCls =
  "inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

/** Approve/Decline buttons for a single interest row. Mirrors registrations/
   row-actions' pattern (useTransition sharing one pending state), but a
   decision can be switched either way afterwards — MUTUAL/DECLINED just
   disables the button matching the current status instead of hiding it. */
export function RowActions({
  interestId,
  status,
  approveLabel,
  declineLabel,
}: {
  interestId: number;
  status: InterestStatus;
  approveLabel: string;
  declineLabel: string;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending || status === "MUTUAL"}
        onClick={() => start(async () => { await approveInterest(interestId); })}
        className={btnCls}
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {approveLabel}
      </button>
      <button
        type="button"
        disabled={pending || status === "DECLINED"}
        onClick={() => start(async () => { await declineInterest(interestId); })}
        className={btnCls}
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {declineLabel}
      </button>
    </div>
  );
}
