/* Undo/redo for the translation editor.

   Pure data — no React, no DB. The editor pushes a step for every change it
   makes, and replays whatever `undo`/`redo` hand back; that split is what makes
   the tricky parts (coalescing a burst of keystrokes into one step, the limit,
   dropping the redo stack on a new edit) unit-testable in history.test.ts. */

import type { Locale } from "@/lib/i18n";
import type { Values } from "@/lib/i18n-validate";
import type { Mark } from "./mark";

/** Everything about one row a translator can change. */
export type RowSnapshot = { values: Values; mark: Mark; note: string };

/** One row inside a step: where it was, where it went. */
export type RowChange = { key: string; before: RowSnapshot; after: RowSnapshot };

/** What produced a step — drives the tooltips and the coalescing rule. */
export type StepKind =
  | { type: "cell"; key: string; loc: Locale }
  | { type: "mark"; key: string }
  | { type: "note"; key: string }
  | { type: "revert"; key: string }
  | { type: "import"; count: number };

export type Step = {
  kind: StepKind;
  changes: RowChange[];
  /** Date.now() of the change — only used to decide coalescing. */
  at: number;
};

export type History = { past: Step[]; future: Step[] };

export const EMPTY_HISTORY: History = { past: [], future: [] };

/** Steps remembered; older ones fall off the bottom. */
export const HISTORY_LIMIT = 100;

/** Edits of the same target closer together than this become one step. */
export const COALESCE_MS = 1500;

/**
 * Same target *and* close in time. Without this, undo would walk back one
 * keystroke at a time; with a target check, typing in another cell always
 * starts a new step even if it happens right away.
 */
export function canCoalesce(prev: Step, next: Step): boolean {
  if (next.at - prev.at >= COALESCE_MS) return false;
  const a = prev.kind;
  const b = next.kind;
  if (a.type !== b.type) return false;
  if (b.type === "cell") return a.type === "cell" && a.key === b.key && a.loc === b.loc;
  // Mark clicks and note typing coalesce per row; a revert or a CSV import is
  // one deliberate action and always stands on its own.
  if (b.type === "mark" || b.type === "note") return "key" in a && a.key === b.key;
  return false;
}

/** Fold `next` into `prev`: the oldest `before`, the newest `after`, per key. */
function merge(prev: Step, next: Step): Step {
  const byKey = new Map<string, RowChange>();
  for (const c of prev.changes) byKey.set(c.key, c);
  for (const c of next.changes) {
    const first = byKey.get(c.key);
    byKey.set(c.key, first ? { key: c.key, before: first.before, after: c.after } : c);
  }
  return { kind: next.kind, changes: [...byKey.values()], at: next.at };
}

/** Remember a change. Any new change makes the "вперёд" stack meaningless. */
export function push(history: History, step: Step): History {
  if (step.changes.length === 0) return history;
  const last = history.past[history.past.length - 1];
  if (last && canCoalesce(last, step)) {
    return { past: [...history.past.slice(0, -1), merge(last, step)], future: [] };
  }
  const past = [...history.past, step];
  return {
    past: past.length > HISTORY_LIMIT ? past.slice(past.length - HISTORY_LIMIT) : past,
    future: [],
  };
}

/** Take one step back; null when there is nothing to undo. */
export function undo(history: History): { history: History; step: Step } | null {
  const step = history.past[history.past.length - 1];
  if (!step) return null;
  return { history: { past: history.past.slice(0, -1), future: [step, ...history.future] }, step };
}

/** Take one step forward; null when there is nothing to redo. */
export function redo(history: History): { history: History; step: Step } | null {
  const [step, ...future] = history.future;
  if (!step) return null;
  return { history: { past: [...history.past, step], future }, step };
}

/** "1 ключ / 2 ключа / 5 ключей" — the label is read by a non-technical user. */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = n % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/** Russian description of a step, e.g. "правка nav.catalog (ru)". */
export function label(step: Step): string {
  const kind = step.kind;
  switch (kind.type) {
    case "cell":
      return `правка ${kind.key} (${kind.loc})`;
    case "mark":
      return `метка ${kind.key}`;
    case "note":
      return `заметка ${kind.key}`;
    case "revert":
      return `возврат как в коде: ${kind.key}`;
    case "import":
      return `импорт CSV: ${kind.count} ${plural(kind.count, "ключ", "ключа", "ключей")}`;
  }
}
