"use client";

import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { withdrawInterest } from "../actions";
import { emitInterestChanged } from "../interest-events";

/** "Remove from interests" button for a My Interests row (#24) — same
 *  useTransition + revalidatePath pattern as ExpressInterestButton in
 *  browse/browse-view.tsx: the row disappears once the action resolves and
 *  the page's props (getBrandInterests) refresh. Also emits
 *  INTEREST_CHANGED_EVENT so the sidebar badge updates immediately (IA-9). */
export function RemoveInterestButton({
  projectId,
  label,
  errorMessage,
}: {
  projectId: number;
  label: string;
  errorMessage: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        className="gap-1.5 text-muted-foreground hover:text-danger"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await withdrawInterest(projectId);
            if (!res.ok) setError(res.error ?? errorMessage);
            else emitInterestChanged(); // IA-9 — sync the sidebar badge without a reload
          })
        }
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        {label}
      </Button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
