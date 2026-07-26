import { describe, expect, it } from "vitest";
import {
  COALESCE_MS,
  EMPTY_HISTORY,
  HISTORY_LIMIT,
  canCoalesce,
  label,
  plural,
  push,
  redo,
  undo,
  type RowSnapshot,
  type Step,
} from "./history";

/* Undo/redo of /admin/i18n: coalescing a burst of keystrokes, the limit, and
   the redo stack dying on a new edit. */

function snap(ru: string, extra: Partial<RowSnapshot> = {}): RowSnapshot {
  return { values: { hy: "Կատալոգ", ru, en: "Catalog" }, mark: "NONE", note: "", ...extra };
}

/** Cell edit of `key`.`loc`: ru goes from `before` to `after` at time `at`. */
function cellStep(key: string, loc: "hy" | "ru" | "en", before: string, after: string, at: number): Step {
  return {
    kind: { type: "cell", key, loc },
    changes: [{ key, before: snap(before), after: snap(after) }],
    at,
  };
}

describe("push", () => {
  it("coalesces consecutive edits of the same cell into one step", () => {
    let h = push(EMPTY_HISTORY, cellStep("nav.catalog", "ru", "", "К", 1000));
    h = push(h, cellStep("nav.catalog", "ru", "К", "Ка", 1200));
    h = push(h, cellStep("nav.catalog", "ru", "Ка", "Кат", 1400));
    expect(h.past).toHaveLength(1);
    // The single step spans the whole burst: empty → "Кат".
    expect(h.past[0].changes[0].before.values.ru).toBe("");
    expect(h.past[0].changes[0].after.values.ru).toBe("Кат");
  });

  it("starts a new step after a pause", () => {
    let h = push(EMPTY_HISTORY, cellStep("nav.catalog", "ru", "", "К", 1000));
    h = push(h, cellStep("nav.catalog", "ru", "К", "Ка", 1000 + COALESCE_MS));
    expect(h.past).toHaveLength(2);
  });

  it("starts a new step when the target changes", () => {
    let h = push(EMPTY_HISTORY, cellStep("nav.catalog", "ru", "", "К", 1000));
    h = push(h, cellStep("nav.catalog", "en", "", "C", 1100)); // other locale
    h = push(h, cellStep("nav.about", "en", "", "A", 1200)); // other key
    expect(h.past).toHaveLength(3);
  });

  it("never coalesces a revert or an import", () => {
    const revert: Step = {
      kind: { type: "revert", key: "nav.catalog" },
      changes: [{ key: "nav.catalog", before: snap("Каталог"), after: snap("") }],
      at: 1000,
    };
    let h = push(EMPTY_HISTORY, revert);
    h = push(h, { ...revert, at: 1100 });
    expect(h.past).toHaveLength(2);
  });

  it("drops the redo stack", () => {
    let h = push(EMPTY_HISTORY, cellStep("nav.catalog", "ru", "", "К", 1000));
    h = undo(h)!.history;
    expect(h.future).toHaveLength(1);
    h = push(h, cellStep("nav.about", "ru", "", "О", 5000));
    expect(h.future).toEqual([]);
    expect(h.past).toHaveLength(1);
  });

  it("keeps at most HISTORY_LIMIT steps, dropping the oldest", () => {
    let h = EMPTY_HISTORY;
    for (let i = 0; i < HISTORY_LIMIT + 10; i++) {
      // Far apart in time so nothing coalesces.
      h = push(h, cellStep(`key.${i}`, "ru", "", String(i), i * COALESCE_MS * 2));
    }
    expect(h.past).toHaveLength(HISTORY_LIMIT);
    expect(h.past[0].kind).toEqual({ type: "cell", key: "key.10", loc: "ru" });
  });

  it("ignores an empty step", () => {
    const empty: Step = { kind: { type: "import", count: 0 }, changes: [], at: 1000 };
    expect(push(EMPTY_HISTORY, empty)).toBe(EMPTY_HISTORY);
  });
});

describe("undo / redo", () => {
  it("walks back and forth over the same steps", () => {
    let h = push(EMPTY_HISTORY, cellStep("nav.catalog", "ru", "", "К", 1000));
    h = push(h, cellStep("nav.about", "ru", "", "О", 9000));

    const back = undo(h)!;
    expect(back.step.kind).toEqual({ type: "cell", key: "nav.about", loc: "ru" });
    expect(back.history.past).toHaveLength(1);

    const forward = redo(back.history)!;
    expect(forward.step).toBe(back.step);
    expect(forward.history.past).toHaveLength(2);
    expect(forward.history.future).toEqual([]);
  });

  it("returns null on empty stacks", () => {
    expect(undo(EMPTY_HISTORY)).toBeNull();
    expect(redo(EMPTY_HISTORY)).toBeNull();
  });

  it("undoes a coalesced burst in one go", () => {
    let h = push(EMPTY_HISTORY, cellStep("nav.catalog", "ru", "Каталог", "Катало", 1000));
    h = push(h, cellStep("nav.catalog", "ru", "Катало", "Катал", 1100));
    const back = undo(h)!;
    expect(back.step.changes[0].before.values.ru).toBe("Каталог");
    expect(back.history.past).toEqual([]);
  });

  it("keeps the mark and the note in the snapshot it restores", () => {
    const before = snap("Каталог", { mark: "RED", note: "спросить" });
    const after = snap("Каталог", { mark: "GREEN", note: "" });
    const h = push(EMPTY_HISTORY, {
      kind: { type: "mark", key: "nav.catalog" },
      changes: [{ key: "nav.catalog", before, after }],
      at: 1000,
    });
    expect(undo(h)!.step.changes[0].before).toEqual(before);
  });
});

describe("canCoalesce", () => {
  it("refuses steps of different kinds", () => {
    const cell = cellStep("nav.catalog", "ru", "", "К", 1000);
    const mark: Step = {
      kind: { type: "mark", key: "nav.catalog" },
      changes: cell.changes,
      at: 1050,
    };
    expect(canCoalesce(cell, mark)).toBe(false);
  });
});

describe("label", () => {
  it("describes every kind of step in Russian", () => {
    expect(label(cellStep("nav.catalog", "ru", "", "К", 0))).toBe("правка nav.catalog (ru)");
    expect(
      label({ kind: { type: "mark", key: "nav.catalog" }, changes: [], at: 0 }),
    ).toBe("метка nav.catalog");
    expect(label({ kind: { type: "note", key: "nav.catalog" }, changes: [], at: 0 })).toBe(
      "заметка nav.catalog",
    );
    expect(label({ kind: { type: "revert", key: "nav.catalog" }, changes: [], at: 0 })).toBe(
      "возврат как в коде: nav.catalog",
    );
    expect(label({ kind: { type: "import", count: 42 }, changes: [], at: 0 })).toBe(
      "импорт CSV: 42 ключа",
    );
  });
});

describe("plural", () => {
  it("picks the Russian form", () => {
    const форма = (n: number) => plural(n, "ключ", "ключа", "ключей");
    expect([1, 2, 5, 11, 21, 24, 111].map(форма)).toEqual([
      "ключ",
      "ключа",
      "ключей",
      "ключей",
      "ключ",
      "ключа",
      "ключей",
    ]);
  });
});
