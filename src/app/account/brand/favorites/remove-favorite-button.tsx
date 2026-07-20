"use client";

import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeFavorite } from "../favorite-actions";

/** "Remove from favorites" button for a Favorites row (#22) — same
 *  useTransition + revalidatePath pattern as RemoveInterestButton. No
 *  badge event to emit — favorites don't drive a sidebar counter. */
export function RemoveFavoriteButton({
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
            const res = await removeFavorite(projectId);
            if (!res.ok) setError(res.error ?? errorMessage);
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
