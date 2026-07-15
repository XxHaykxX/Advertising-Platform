"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { approveProject, rejectProject } from "./actions";

const btnCls =
  "inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

/** Approve/Reject buttons for a single moderation-queue row. Mirrors the
   registrations/row-actions.tsx pattern: a plain client component driving a
   bound Server Action via useTransition, no form/redirect involved. */
export function RowActions({ projectId }: { projectId: number }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => approveProject(projectId))}
        className={btnCls}
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const reason = window.prompt("Rejection reason (optional):") ?? "";
          start(() => rejectProject(projectId, reason || undefined));
        }}
        className={btnCls}
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Reject
      </button>
    </div>
  );
}
