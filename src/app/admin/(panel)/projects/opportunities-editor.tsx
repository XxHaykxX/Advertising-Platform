"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { OpportunityDTO } from "@/lib/types";
import { saveOpportunities, type SubEditorState } from "./actions";

const EMPTY_ROW: OpportunityDTO = {
  sceneNo: 1,
  description: "",
  mood: "",
  rationale: "",
  type: "visual",
  prominence: "background",
  category: "",
  estValue: 0,
  durationSec: 0,
};

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary";
const miniLabelCls = "mb-1 block text-xs text-muted-foreground";

export function OpportunitiesEditor({
  projectId,
  opportunities,
}: {
  projectId: number;
  opportunities: OpportunityDTO[];
}) {
  const action = saveOpportunities.bind(null, projectId);
  const [state, formAction, pending] = useActionState<SubEditorState, FormData>(action, {});
  const [rows, setRows] = useState<OpportunityDTO[]>(opportunities);

  function update(i: number, patch: Partial<OpportunityDTO>) {
    setRows((arr) => arr.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} opportunit{rows.length === 1 ? "y" : "ies"}
        </p>
        <button
          type="button"
          onClick={() => setRows((arr) => [...arr, { ...EMPTY_ROW, sceneNo: arr.length + 1 }])}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
        >
          <Plus className="h-3.5 w-3.5" /> Add opportunity
        </button>
      </div>

      {rows.length === 0 && <p className="text-sm text-muted-foreground">No placement opportunities.</p>}

      {rows.map((r, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border bg-section p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="grid flex-1 gap-3 sm:grid-cols-4">
              <label className="block">
                <span className={miniLabelCls}>Scene #</span>
                <input
                  type="number"
                  min={1}
                  value={r.sceneNo}
                  onChange={(e) => update(i, { sceneNo: Number(e.target.value) })}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className={miniLabelCls}>Type</span>
                <select value={r.type} onChange={(e) => update(i, { type: e.target.value })} className={inputCls}>
                  <option value="visual">Visual</option>
                  <option value="audio">Audio</option>
                </select>
              </label>
              <label className="block">
                <span className={miniLabelCls}>Prominence</span>
                <select
                  value={r.prominence}
                  onChange={(e) => update(i, { prominence: e.target.value })}
                  className={inputCls}
                >
                  <option value="background">Background</option>
                  <option value="active">Active</option>
                </select>
              </label>
              <label className="block">
                <span className={miniLabelCls}>Category</span>
                <input
                  value={r.category}
                  onChange={(e) => update(i, { category: e.target.value })}
                  placeholder="Beverages"
                  className={inputCls}
                />
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

          <label className="block">
            <span className={miniLabelCls}>Description</span>
            <textarea
              value={r.description}
              onChange={(e) => update(i, { description: e.target.value })}
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </label>
          <label className="block">
            <span className={miniLabelCls}>Rationale</span>
            <textarea
              value={r.rationale}
              onChange={(e) => update(i, { rationale: e.target.value })}
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className={miniLabelCls}>Mood</span>
              <input value={r.mood} onChange={(e) => update(i, { mood: e.target.value })} className={inputCls} />
            </label>
            <label className="block">
              <span className={miniLabelCls}>Est. value ($)</span>
              <input
                type="number"
                min={0}
                value={r.estValue}
                onChange={(e) => update(i, { estValue: Number(e.target.value) })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={miniLabelCls}>Duration (sec)</span>
              <input
                type="number"
                min={0}
                value={r.durationSec}
                onChange={(e) => update(i, { durationSec: Number(e.target.value) })}
                className={inputCls}
              />
            </label>
          </div>
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
        Save opportunities
      </button>
    </form>
  );
}
