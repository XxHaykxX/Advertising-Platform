"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { approveProject, rejectProject } from "./actions";

const btnCls =
  "inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

/** Approve/Reject buttons for a single moderation-queue row. Mirrors the
   registrations/row-actions.tsx pattern: a plain client component driving a
   bound Server Action via useTransition, no form/redirect involved. */
export function RowActions({ projectId }: { projectId: number }) {
  const [pending, start] = useTransition();
  // Approval can now be refused server-side when the project is missing
  // something required for publication (audit 2.8) — surface that instead of
  // letting the click look like it worked.
  const [error, setError] = useState("");

  return (
    <div className="flex flex-col gap-2">
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError("");
            const result = await approveProject(projectId);
            if ("error" in result) setError(result.error);
          })
        }
        className={btnCls}
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          // The reason reaches the creator now (email + cabinet + in-app
          // notification), so it is no longer "optional" in the throwaway
          // sense it used to be.
          const reason = window.prompt("Rejection reason — the creator will see this:") ?? "";
          start(async () => {
            setError("");
            await rejectProject(projectId, reason || undefined);
          });
        }}
        className={btnCls}
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Reject
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
