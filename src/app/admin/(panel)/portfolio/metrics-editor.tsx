"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

/* Metrics editor for a portfolio case (2026-07-27).
 *
 * The column stores a free-form JSON object — {"views":"2.1M","recall":"+38%"} —
 * and the form used to ask for exactly that, hand-typed, with a validation error
 * if a brace was missing. Nobody should have to write JSON in an admin panel, so
 * this edits it as rows: metric on the left, value on the right, mirrored into a
 * hidden input as JSON for the unchanged server action.
 *
 * The metric list matches the `metric.*` keys the public page can localize
 * (src/components/portfolio-page/metrics.ts). A case that already carries a key
 * outside the list keeps it — it renders as its own option rather than being
 * silently rewritten on the first save. */

/** Metric keys with a localized label on the public side, plus the English
 *  label shown here (the admin is English-only). */
const KNOWN_METRICS: { key: string; label: string }[] = [
  { key: "views", label: "Views" },
  { key: "recall", label: "Recall" },
  { key: "ctr", label: "CTR" },
  { key: "storeVisits", label: "Store visits" },
  { key: "shares", label: "Shares" },
  { key: "sentiment", label: "Sentiment" },
  { key: "searchLift", label: "Search lift" },
  { key: "recallDurability", label: "Recall durability" },
];

type Row = { key: string; value: string };

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary";

/** Stored JSON -> editor rows. Anything unparseable is treated as "no metrics"
 *  rather than throwing: the column is free-form and predates this editor. */
function parseRows(json: string): Row[] {
  if (!json.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
    return Object.entries(parsed as Record<string, unknown>)
      .filter((e): e is [string, string] => typeof e[1] === "string")
      .map(([key, value]) => ({ key, value }));
  } catch {
    return [];
  }
}

/** Rows -> the JSON the server action still expects. Blank rows are dropped, so
 *  an empty editor submits "" and the column ends up null. */
function toJson(rows: Row[]): string {
  const filled = rows.filter((r) => r.key.trim() && r.value.trim());
  if (filled.length === 0) return "";
  return JSON.stringify(Object.fromEntries(filled.map((r) => [r.key.trim(), r.value.trim()])));
}

export function MetricsEditor({ name, initial }: { name: string; initial: string }) {
  const [rows, setRows] = useState<Row[]>(() => parseRows(initial));

  // A failed submit re-renders the form with the echoed values — reseed so the
  // editor shows what the server sent back rather than the first mount's state.
  // Adjusted during render, not from an effect (React's "you might not need an
  // effect") — the re-render lands before paint, so no stale frame.
  const [seenInitial, setSeenInitial] = useState(initial);
  if (seenInitial !== initial) {
    setSeenInitial(initial);
    setRows(parseRows(initial));
  }

  function update(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    const used = new Set(rows.map((r) => r.key));
    const next = KNOWN_METRICS.find((m) => !used.has(m.key));
    setRows((prev) => [...prev, { key: next?.key ?? "", value: "" }]);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={toJson(rows)} />

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No metrics yet — add the numbers this case is worth showing off.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => {
            const isCustom = r.key !== "" && !KNOWN_METRICS.some((m) => m.key === r.key);
            return (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px] items-center gap-2">
                <select
                  value={r.key}
                  onChange={(e) => update(i, { key: e.target.value })}
                  className={inputCls}
                >
                  <option value="">— pick a metric —</option>
                  {/* A key this case already had but the list doesn't know: keep
                      it selectable so editing the value can't rewrite the key. */}
                  {isCustom && <option value={r.key}>{r.key}</option>}
                  {KNOWN_METRICS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <input
                  value={r.value}
                  onChange={(e) => update(i, { value: e.target.value })}
                  placeholder="2.1M / +38% / 4.7"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label="Remove metric"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
      >
        <Plus className="h-3.5 w-3.5" /> Add metric
      </button>
    </div>
  );
}
