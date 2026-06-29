"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { saveNote, type NoteState } from "../actions";

export function NoteForm({
  id,
  initial,
}: {
  id: number;
  initial: string;
}) {
  const action = saveNote.bind(null, id);
  const [state, formAction, pending] = useActionState<NoteState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <textarea
        name="note"
        rows={4}
        defaultValue={initial}
        placeholder="Manager note…"
        className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-foreground placeholder:text-white/35 outline-none transition-colors focus:border-primary/50"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-600 disabled:opacity-70"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save note
        </button>
        {state.ok && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
