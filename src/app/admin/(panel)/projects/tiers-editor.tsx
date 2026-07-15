"use client";

import { Plus, Trash2 } from "lucide-react";

// Controlled sponsorship-tiers section (#20²). Same refactor as ActorsSection:
// no standalone <form>/saveTiers action anymore — rows are owned by the parent
// ProjectForm, mirrored into a hidden `tiersRows` input, and persisted by
// createProject/updateProject in the same transaction as the project itself.
// benefits stays a newline-separated string in the UI; the server action
// converts it to a JSON string[] at rest.
export type TierRow = { name: string; priceAmd: number; benefits: string };

export const EMPTY_TIER: TierRow = { name: "", priceAmd: 0, benefits: "" };

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary";
const miniLabelCls = "mb-1 block text-xs text-muted-foreground";

export function TiersSection({
  value,
  onChange,
}: {
  value: TierRow[];
  onChange: (rows: TierRow[]) => void;
}) {
  function update(i: number, patch: Partial<TierRow>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {value.length} tier{value.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => onChange([...value, { ...EMPTY_TIER }])}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
        >
          <Plus className="h-3.5 w-3.5" /> Add tier
        </button>
      </div>

      {value.length === 0 && <p className="text-sm text-muted-foreground">No sponsorship tiers.</p>}

      {value.map((r, i) => (
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
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
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
    </div>
  );
}
