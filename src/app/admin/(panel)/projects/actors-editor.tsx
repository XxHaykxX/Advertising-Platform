"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { ActorDTO } from "@/lib/types";
import { saveActors, type SubEditorState } from "./actions";

type ActorRow = { name: string; role: string };

const EMPTY_ROW: ActorRow = { name: "", role: "" };

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary";
const miniLabelCls = "mb-1 block text-xs text-muted-foreground";

export function ActorsEditor({
  projectId,
  actors,
}: {
  projectId: number;
  actors: ActorDTO[];
}) {
  const action = saveActors.bind(null, projectId);
  const [state, formAction, pending] = useActionState<SubEditorState, FormData>(action, {});
  const [rows, setRows] = useState<ActorRow[]>(actors.map((a) => ({ name: a.name, role: a.role })));

  function update(i: number, patch: Partial<ActorRow>) {
    setRows((arr) => arr.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} actor{rows.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => setRows((arr) => [...arr, { ...EMPTY_ROW }])}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
        >
          <Plus className="h-3.5 w-3.5" /> Add actor
        </button>
      </div>

      {rows.length === 0 && <p className="text-sm text-muted-foreground">No actors.</p>}

      {rows.map((r, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-section p-4">
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={miniLabelCls}>Name</span>
              <input value={r.name} onChange={(e) => update(i, { name: e.target.value })} className={inputCls} />
            </label>
            <label className="block">
              <span className={miniLabelCls}>Role</span>
              <input value={r.role} onChange={(e) => update(i, { role: e.target.value })} className={inputCls} />
            </label>
          </div>
          <button
            type="button"
            onClick={() => setRows((arr) => arr.filter((_, idx) => idx !== i))}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
            aria-label="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {state.error && (
        <p className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">
          {state.error}
        </p>
      )}
      {state.ok && !pending && <p className="text-sm text-success">Saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-70"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save actors
      </button>
    </form>
  );
}
