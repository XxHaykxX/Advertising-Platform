"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { saveTiers, type SubEditorState } from "./actions";

// benefits is a newline-separated string in the form; saveTiers converts it to
// a JSON string[] at rest (mirrors the gallery/platforms textarea convention).
type TierRow = { name: string; priceAmd: number; benefits: string };

const EMPTY_ROW: TierRow = { name: "", priceAmd: 0, benefits: "" };

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary";
const miniLabelCls = "mb-1 block text-xs text-muted-foreground";

export function TiersEditor({
  projectId,
  tiers,
}: {
  projectId: number;
  tiers: TierRow[];
}) {
  const action = saveTiers.bind(null, projectId);
  const [state, formAction, pending] = useActionState<SubEditorState, FormData>(action, {});
  const [rows, setRows] = useState<TierRow[]>(tiers);

  function update(i: number, patch: Partial<TierRow>) {
    setRows((arr) => arr.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} tier{rows.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => setRows((arr) => [...arr, { ...EMPTY_ROW }])}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
        >
          <Plus className="h-3.5 w-3.5" /> Add tier
        </button>
      </div>

      {rows.length === 0 && <p className="text-sm text-muted-foreground">No sponsorship tiers.</p>}

      {rows.map((r, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border bg-section p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={miniLabelCls}>Tier name</span>
                <input
                  value={r.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder="Official Sponsor"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className={miniLabelCls}>Price (AMD)</span>
                <input
                  type="number"
                  min={0}
                  value={r.priceAmd}
                  onChange={(e) => update(i, { priceAmd: Number(e.target.value) })}
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
            <span className={miniLabelCls}>Benefits (one per line)</span>
            <textarea
              value={r.benefits}
              onChange={(e) => update(i, { benefits: e.target.value })}
              rows={5}
              placeholder={"Logo on selected promo materials\nSocial promo presence\nSpecial thanks in the credits\nPremiere invitations"}
              className={`${inputCls} resize-none`}
            />
          </label>
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
        Save tiers
      </button>
    </form>
  );
}
