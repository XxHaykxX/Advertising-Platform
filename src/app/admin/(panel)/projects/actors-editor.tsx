"use client";

import { Plus, Trash2 } from "lucide-react";
import { ImageUploader } from "./image-uploader";

// Controlled cast/crew section (#20²). Rewritten from a standalone <form> +
// saveActors action into a presentational section whose rows are owned by the
// parent ProjectForm — so cast/crew now save together with the main project in
// a single submit (no more two-step create→edit, no nested <form>). The parent
// mirrors `value` into a hidden `actorsRows` input; createProject/updateProject
// persist it transactionally.
export type ActorRow = { name: string; role: string; kind: string; photo: string };

export const EMPTY_ACTOR: ActorRow = { name: "", role: "", kind: "CAST", photo: "" };

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary";
const miniLabelCls = "mb-1 block text-xs text-muted-foreground";

export function ActorsSection({
  value,
  onChange,
}: {
  value: ActorRow[];
  onChange: (rows: ActorRow[]) => void;
}) {
  function update(i: number, patch: Partial<ActorRow>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {value.length} member{value.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => onChange([...value, { ...EMPTY_ACTOR }])}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
        >
          <Plus className="h-3.5 w-3.5" /> Add member
        </button>
      </div>

      {value.length === 0 && <p className="text-sm text-muted-foreground">No cast / crew yet.</p>}

      {value.map((r, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border bg-section p-4">
          <div className="flex items-start gap-3">
            <div className="grid flex-1 gap-3 sm:grid-cols-3">
              <label className="block">
                <span className={miniLabelCls}>Name</span>
                <input value={r.name} onChange={(e) => update(i, { name: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className={miniLabelCls}>Role</span>
                <input value={r.role} onChange={(e) => update(i, { role: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className={miniLabelCls}>Kind</span>
                <select value={r.kind} onChange={(e) => update(i, { kind: e.target.value })} className={inputCls}>
                  <option value="CAST">Cast</option>
                  <option value="CREW">Crew</option>
                </select>
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
          <div>
            <span className={miniLabelCls}>Photo</span>
            <ImageUploader
              dir="actors"
              initial={r.photo}
              label={r.photo ? "Replace photo" : "Upload photo"}
              onChange={(paths) => update(i, { photo: paths[0] ?? "" })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
