"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";

/**
 * One-line-per-item editor for the "what the brand gets" lists (placement
 * descriptions, tier benefits).
 *
 * Those lists were a plain <textarea> whose "one item per line" rule existed
 * only in the placeholder: nothing on screen said a newline meant a bullet, a
 * single item couldn't be moved or deleted without selecting exactly the right
 * characters, and the rendered result (a • list on the report page) looked
 * nothing like what was being typed.
 *
 * The value stays a newline-separated string, so every caller — and both server
 * actions, which already trim and drop blanks in benefitsToJson — keeps working
 * unchanged. This component only changes how that string is entered.
 *
 * Reordering is done with buttons (and Alt+Arrow), NOT drag-and-drop: these
 * lists live inside a card that is itself a @dnd-kit sortable item, and nesting
 * a second DndContext inside it makes the two compete for the same pointer.
 */
export function BulletListEditor({
  value,
  onChange,
  placeholder = "",
  addLabel = "Add item",
  removeLabel = "Remove",
  moveUpLabel = "Move up",
  moveDownLabel = "Move down",
  emptyHint,
  autoFocusLast = false,
}: {
  /** Newline-separated items — the same string shape the callers store. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  addLabel?: string;
  removeLabel?: string;
  moveUpLabel?: string;
  moveDownLabel?: string;
  /** Shown instead of the list while there is nothing to show. */
  emptyHint?: string;
  /** Focus the last item on mount — used when a row is added by cloning. */
  autoFocusLast?: boolean;
}) {
  // The items are LOCAL state mirrored out as a newline string, not derived
  // from that string on every render: "" has to mean both "no items" (a fresh
  // row shows the hint, not a stray input) and "one item, still empty" (the
  // input the Add button just created). Deriving lost the second one — the
  // first bullet you added vanished as you typed it.
  const [items, setItems] = useState<string[]>(() => (value === "" ? [] : value.split("\n")));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Re-seed when the value changes underneath us (a form reset, a restored
  // draft, a row cloned into this slot). Our own edits are skipped: they
  // already produced this exact string.
  // Stays an effect on purpose. Adjusting during render (the usual cure for
  // this warning) would re-run the comparison on EVERY render, not only when
  // `value` changes — and a parent that takes our onChange without feeding the
  // new string back would then have the user's typing overwritten from its
  // stale prop on the next unrelated re-render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems((prev) => (prev.join("\n") === value ? prev : value === "" ? [] : value.split("\n")));
  }, [value]);

  // Which item to focus after the next render, and where to put the caret.
  // Set by every structural change (add/remove/move), consumed by the effect
  // below — the input for a brand-new index doesn't exist until React commits.
  const [focus, setFocus] = useState<{ index: number; caret: "start" | "end" } | null>(
    autoFocusLast ? { index: Math.max(0, items.length - 1), caret: "end" } : null,
  );

  // Stays an effect: the input for a brand-new index only exists after commit,
  // and clearing the one-shot signal ends that DOM work.
  useEffect(() => {
    if (!focus) return;
    const el = inputs.current[focus.index];
    if (el) {
      el.focus();
      const pos = focus.caret === "end" ? el.value.length : 0;
      el.setSelectionRange(pos, pos);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFocus(null);
  }, [focus]);

  const commit = (next: string[]) => {
    setItems(next);
    onChange(next.join("\n"));
  };

  function setAt(i: number, text: string) {
    commit(items.map((line, idx) => (idx === i ? text : line)));
  }

  function insertAfter(i: number) {
    const next = [...items.slice(0, i + 1), "", ...items.slice(i + 1)];
    commit(next);
    setFocus({ index: i + 1, caret: "start" });
  }

  function removeAt(i: number, caret: "start" | "end" = "end") {
    commit(items.filter((_, idx) => idx !== i));
    if (items.length > 1) setFocus({ index: Math.max(0, i - 1), caret });
  }

  function move(i: number, delta: number) {
    const to = i + delta;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[i], next[to]] = [next[to], next[i]];
    commit(next);
    setFocus({ index: to, caret: "end" });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    // Alt+Arrow reorders; plain Arrow walks between items, so a list can be
    // gone through without leaving the keyboard.
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      move(i, e.key === "ArrowUp" ? -1 : 1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      insertAfter(i);
      return;
    }
    // Backspace on an empty item removes it — the same muscle memory as any
    // bullet list in a document editor. On a non-empty item it deletes text as
    // usual; the last remaining item is never auto-removed, or the list would
    // vanish under the cursor.
    if (e.key === "Backspace" && items[i] === "" && items.length > 1) {
      e.preventDefault();
      removeAt(i);
      return;
    }
    if (e.key === "ArrowUp" && i > 0) {
      e.preventDefault();
      setFocus({ index: i - 1, caret: "end" });
      return;
    }
    if (e.key === "ArrowDown" && i < items.length - 1) {
      e.preventDefault();
      setFocus({ index: i + 1, caret: "end" });
    }
  }

  return (
    <div className="space-y-1.5">
      {items.length === 0 && emptyHint ? (
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      ) : null}

      {items.map((line, i) => (
        <div key={i} className="group/item flex items-center gap-1.5">
          <span aria-hidden className="select-none text-muted-foreground">
            •
          </span>
          <input
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={line}
            onChange={(e) => setAt(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:bg-card"
          />
          {/* Controls stay mounted (opacity, not conditional render) so the
              row height never jumps as the pointer crosses it. */}
          <div className="flex shrink-0 items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover/item:opacity-100">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label={moveUpLabel}
              title={moveUpLabel}
              className="grid h-7 w-6 place-items-center rounded text-muted-foreground hover:text-primary disabled:opacity-30"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === items.length - 1}
              aria-label={moveDownLabel}
              title={moveDownLabel}
              className="grid h-7 w-6 place-items-center rounded text-muted-foreground hover:text-primary disabled:opacity-30"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={removeLabel}
              title={removeLabel}
              className="grid h-7 w-6 place-items-center rounded text-muted-foreground hover:text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => insertAfter(items.length - 1)}
        className="inline-flex items-center gap-1 rounded-lg px-1 py-1 text-xs text-muted-foreground hover:text-primary"
      >
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </button>
    </div>
  );
}
