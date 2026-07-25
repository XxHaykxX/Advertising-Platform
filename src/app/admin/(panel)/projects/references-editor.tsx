"use client";

import { Plus, Trash2 } from "lucide-react";
import type { makeUI } from "@/lib/i18n";
import type { ReferenceRow } from "./form-shared";

// Controlled Reference Projects editor (admin redesign phase 2): a small
// repeatable list of { name, url } rows, mirrored by the parent ProjectForm
// into a hidden `references` input (JSON.stringify(rows)) and stored as-is in
// the `references` @db.Text column. Unlike ActorsSection/TiersSection, rows
// aren't drag-reorderable — order is just insertion order, and index is a
// safe React key since rows are only ever appended/removed, never shuffled.
export const EMPTY_REFERENCE: ReferenceRow = { name: "", url: "" };

const cellCls =
  "w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-card";

export function ReferencesSection({
  value,
  onChange,
  t,
}: {
  value: ReferenceRow[];
  onChange: (rows: ReferenceRow[]) => void;
  /** ProjectForm's own locale-aware translator (#15) — see ActorsSection's
   *  matching prop for the reasoning. */
  t: ReturnType<typeof makeUI>;
}) {
  function update(i: number, patch: Partial<ReferenceRow>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    onChange([...value, { ...EMPTY_REFERENCE }]);
  }

  function removeRow(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("projectForm.referencesEmpty")}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden grid-cols-[1fr_1fr_32px] items-center gap-2 border-b border-border bg-muted px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
            <span>{t("projectForm.field.referenceName")}</span>
            <span>{t("projectForm.field.referenceUrl")}</span>
            <span />
          </div>
          <div className="divide-y divide-border">
            {value.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_32px] items-center gap-x-2 gap-y-1 px-3 py-1.5 sm:grid-cols-[1fr_1fr_32px]"
              >
                <input
                  value={r.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder={t("projectForm.field.referenceName")}
                  className={`${cellCls} col-start-1 row-start-1 sm:col-start-1`}
                />
                <input
                  value={r.url}
                  onChange={(e) => update(i, { url: e.target.value })}
                  placeholder={t("projectForm.field.referenceUrl")}
                  className={`${cellCls} col-span-2 col-start-1 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1`}
                />
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="col-start-2 row-start-1 grid h-8 w-8 place-items-center justify-self-end rounded-lg text-muted-foreground hover:bg-muted hover:text-primary sm:col-start-3"
                  aria-label={t("projectForm.remove")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
      >
        <Plus className="h-3.5 w-3.5" /> {t("projectForm.addReference")}
      </button>
    </div>
  );
}
