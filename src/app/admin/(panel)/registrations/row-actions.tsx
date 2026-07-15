"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { AccountStatus } from "@prisma/client";
import { approveMember, rejectMember, blockMember, unblockMember } from "./actions";

const btnCls =
  "inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

/** Status-dependent action buttons for a single registration row. Mirrors the
   applications/ pattern of transitioning via a bound Server Action, but as a
   client component (useTransition) rather than a plain <form> so several
   buttons can share one pending state and disable together. */
export function RowActions({
  userId,
  status,
  approveLabel,
  rejectLabel,
  blockLabel,
  unblockLabel,
}: {
  userId: number;
  status: AccountStatus;
  approveLabel: string;
  rejectLabel: string;
  blockLabel: string;
  unblockLabel: string;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {(status === "PENDING" || status === "REJECTED") && (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => approveMember(userId))}
          className={btnCls}
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {approveLabel}
        </button>
      )}
      {status === "PENDING" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => rejectMember(userId))}
          className={btnCls}
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {rejectLabel}
        </button>
      )}
      {status === "APPROVED" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => blockMember(userId))}
          className={btnCls}
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {blockLabel}
        </button>
      )}
      {status === "BLOCKED" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => unblockMember(userId))}
          className={btnCls}
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {unblockLabel}
        </button>
      )}
    </div>
  );
}
