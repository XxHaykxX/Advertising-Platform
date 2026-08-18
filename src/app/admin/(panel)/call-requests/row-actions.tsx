"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { markCallRequestHandled } from "./actions";

/** "Mark handled" — same useTransition + router.refresh() shape as
   interests/row-actions.tsx, minus the confirm dialog: unlike accepting or
   declining a brand's offer this doesn't answer anyone, it just checks a
   lead off the list, so nothing here needs a second click to confirm. */
export function RowActions({ id }: { id: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function markHandled() {
    start(async () => {
      setError("");
      const result = await markCallRequestHandled(id);
      if (!result.ok) setError(result.error ?? "Failed to update");
      else router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={markHandled}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Mark handled
      </button>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
