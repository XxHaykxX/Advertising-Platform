"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import type { SafetyCatDTO } from "@/lib/types";
import { saveSafetyCats, type SubEditorState } from "./actions";

// Fixed GARM (Global Alliance for Responsible Media) brand-safety
// categories — rows are never added/removed, only their score + AI
// rationale are editable.
const GARM_CATEGORIES = [
  "Adult Content",
  "Arms & Ammunition",
  "Crime",
  "Drugs",
  "Hate Speech",
  "Military Conflict",
  "Profanity",
  "Sensitive Issues",
  "Spam",
  "Terrorism",
  "Tobacco",
] as const;

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary";

function initRows(safetyCats: SafetyCatDTO[]): SafetyCatDTO[] {
  return GARM_CATEGORIES.map((name) => {
    const existing = safetyCats.find((c) => c.name === name);
    return existing ? { name, score: existing.score, aiText: existing.aiText } : { name, score: 0, aiText: "" };
  });
}

export function SafetyEditor({
  projectId,
  safetyCats,
}: {
  projectId: number;
  safetyCats: SafetyCatDTO[];
}) {
  const action = saveSafetyCats.bind(null, projectId);
  const [state, formAction, pending] = useActionState<SubEditorState, FormData>(action, {});
  const [rows, setRows] = useState<SafetyCatDTO[]>(() => initRows(safetyCats));

  function update(i: number, patch: Partial<SafetyCatDTO>) {
    setRows((arr) => arr.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />

      <div className="space-y-3">
        {rows.map((r, i) => (
          <div
            key={r.name}
            className="grid gap-3 rounded-xl border border-border bg-section p-4 sm:grid-cols-[1fr_100px_2fr]"
          >
            <span className="self-center text-sm font-medium text-foreground">{r.name}</span>
            <input
              type="number"
              min={0}
              max={100}
              value={r.score}
              onChange={(e) => update(i, { score: Number(e.target.value) })}
              className={inputCls}
            />
            <textarea
              value={r.aiText}
              onChange={(e) => update(i, { aiText: e.target.value })}
              placeholder="AI rationale…"
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>
        ))}
      </div>

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
        Save safety scores
      </button>
    </form>
  );
}
