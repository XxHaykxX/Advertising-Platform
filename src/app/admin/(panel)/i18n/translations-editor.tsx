"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CloudUpload,
  ExternalLink,
  Loader2,
  Redo2,
  Save,
  Search,
  Undo2,
  X,
} from "lucide-react";
import type { Locale } from "@/lib/i18n-client";
import { isChanged, validateEntry, type ValidationIssue, type Values } from "@/lib/i18n-validate";
import { MARK_LIST, MARK_META, type Colour, type Mark } from "./mark";
import { CsvTransfer } from "./csv-transfer";
import type { ImportChange, TransferRow } from "./csv-io";
import {
  EMPTY_HISTORY,
  label as stepLabel,
  plural,
  push as pushStep,
  redo as redoStep,
  undo as undoStep,
  type History,
  type RowChange,
  type RowSnapshot,
  type Step,
  type StepKind,
} from "./history";
import { CardRow, GroupHeader, TableRow, type RowState, type TranslationRow } from "./rows";
import { EDIT_LOCALES, fieldClass, iconBtnClass, thClass } from "./ui";
import {
  discardDraft,
  publishTranslations,
  saveDraft,
  saveDraftsBulk,
  type PublishResult,
  type SaveDraftInput,
} from "./actions";

/* The editor itself: one row per dictionary key (rendered by rows.tsx),
   autosaved as a UiDraft. "Сохранить" pushes whatever hasn't reached the DB yet;
   "Опубликовать" writes every changed row into src/lib/i18n.ts as one commit.

   Two views over the same state: a spreadsheet-like table (default — Мариам
   came from a Google Sheet) and the roomier card list. 855 rows is too many to
   paint at once, so the filtered list is rendered PAGE_SIZE rows at a time
   (more as the sentinel below it scrolls into view) and each row is memoized: a
   keystroke re-renders only its own row. Validation runs locally (the rules in
   src/lib/i18n-validate.ts are pure) so a red hint appears as you type, before
   the debounced save round-trips. Every change also goes into history.ts, which
   is what "назад"/"вперёд" replay. */

export type LastPublish = {
  at: string; // ISO — formatted client-side, see <When/>
  by: string;
  keyCount: number;
  commitUrl: string;
};

export type { TranslationRow };

type Chip = "all" | "changed" | "problem" | "green" | "red" | "blue" | "nomark";
type View = "table" | "cards";
type Density = "compact" | "normal";

const CHIPS: { value: Chip; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "changed", label: "Изменённые" },
  { value: "problem", label: "Пустые/проблемные" },
  { value: "green", label: "🟢 Зелёные" },
  { value: "red", label: "🔴 Красные" },
  { value: "blue", label: "🔵 Голубые" },
  { value: "nomark", label: "Без метки" },
];

/** Chips that filter by colour, mapped to the mark they select. */
const CHIP_MARK: Partial<Record<Chip, Mark>> = {
  green: "GREEN",
  red: "RED",
  blue: "BLUE",
  nomark: "NONE",
};

/** Rows added to the list per scroll batch (and shown initially). */
const PAGE_SIZE = 50;
const SAVE_DEBOUNCE_MS = 700;
/** How long the green "сохранено" tick stays before the row goes quiet again. */
const SAVED_BADGE_MS = 1800;
const ALL_GROUPS = "__all__";
/** Rows per saveDraftsBulk call during a CSV import or an undone import
 *  (keeps the payload small and the progress readout moving). */
const BULK_BATCH = 20;
/** Failed keys spelled out in the "не удалось сохранить" message. */
const FAILED_KEYS_SHOWN = 5;

const chipClass =
  "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors";
/** "Сохранить" — same size as the primary button, quieter colours. */
const secondaryBtnClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";
/** Square icon button of the action bar (назад / вперёд). */
const stepBtnClass =
  "inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40";

/** Result of the "Сохранить" button / an undo step, rendered in the action bar
 *  until the next action (never auto-dismissed — Мариам needs to read it). */
type Notice = { tone: "ok" | "info" | "error"; text: string };

function initialState(rows: TranslationRow[]): Record<string, RowState> {
  const out: Record<string, RowState> = {};
  for (const r of rows) {
    out[r.key] = {
      values: { ...(r.draft ?? r.code) },
      mark: r.mark,
      note: r.note,
      publishedAt: r.publishedAt,
      save: "idle",
      error: null,
    };
  }
  return out;
}

/** Timestamp rendered only in the browser's timezone — the server would format
 *  it in the host's, so hydration is deliberately not matched here. */
function When({ iso }: { iso: string }) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {`${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`}
    </time>
  );
}

/** Move the caret into another cell — used by Enter to walk down a column. */
function focusCell(key: string, loc: Locale) {
  const el = document.querySelector<HTMLTextAreaElement>(
    `textarea[data-i18n-key="${key}"][data-i18n-loc="${loc}"]`,
  );
  if (!el) return;
  el.focus();
  el.setSelectionRange(el.value.length, el.value.length);
  el.scrollIntoView({ block: "nearest" });
}

export function TranslationsEditor({
  rows,
  configured,
  repo,
  lastPublish,
}: {
  rows: TranslationRow[];
  configured: boolean;
  repo: string;
  lastPublish: LastPublish | null;
}) {
  const [states, setStates] = useState<Record<string, RowState>>(() => initialState(rows));
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState(ALL_GROUPS);
  const [chip, setChip] = useState<Chip>("all");
  /** Rows rendered so far — grows on scroll, replaces the old pagination. */
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [view, setView] = useState<View>("table");
  const [density, setDensity] = useState<Density>("compact");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [publishing, setPublishing] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [history, setHistory] = useState<History>(EMPTY_HISTORY);
  /** "применяю: 40 / 120" while a multi-row undo/redo is being saved. */
  const [stepProgress, setStepProgress] = useState<{ done: number; total: number } | null>(null);

  /* Where the table header must pin. The action bar above it is itself sticky
     (top-16 on mobile to clear the fixed top bar, top-0 from md up) and its
     height changes when a publish result or a validation-error list appears
     inside it, so measure both instead of hardcoding a magic offset: resolved
     sticky `top` + current height = the bar's bottom edge once stuck. Published
     as a CSS variable consumed by thClass. */
  const barRef = useRef<HTMLDivElement | null>(null);
  const [headTop, setHeadTop] = useState(0);
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const measure = () => {
      const stuckAt = parseFloat(getComputedStyle(bar).top) || 0;
      setHeadTop(Math.round(stuckAt + bar.offsetHeight));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(bar);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Latest state, readable from the debounce timers (which fire outside render)
  // and from the CSV panel's getters (kept stable so it doesn't re-render).
  const statesRef = useRef(states);
  useEffect(() => {
    statesRef.current = states;
  }, [states]);

  // Rows with a pending debounce or an in-flight save — drives the
  // beforeunload guard, so a reload can't drop text that never reached the DB.
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const unsettled = useRef(new Set<string>());
  const [unsettledCount, setUnsettledCount] = useState(0);

  // Timers that take the green "сохранено" tick back off a row. Without them
  // the tick stayed under the key forever and stopped meaning anything.
  const savedTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  useEffect(
    () => () => {
      for (const t of savedTimers.current.values()) clearTimeout(t);
      savedTimers.current.clear();
    },
    [],
  );

  const patch = useCallback((key: string, part: Partial<RowState>) => {
    setStates((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], ...part } } : prev));
  }, []);

  const settle = useCallback((key: string) => {
    unsettled.current.delete(key);
    setUnsettledCount(unsettled.current.size);
  }, []);

  const cancelSavedBadge = useCallback((key: string) => {
    const running = savedTimers.current.get(key);
    if (running) {
      clearTimeout(running);
      savedTimers.current.delete(key);
    }
  }, []);

  /** Flash the tick on some rows, then let them go quiet. */
  const markSaved = useCallback(
    (keys: string[]) => {
      if (keys.length === 0) return;
      setStates((prev) => {
        const next = { ...prev };
        for (const key of keys) {
          const st = next[key];
          if (st) next[key] = { ...st, save: "saved", error: null };
        }
        return next;
      });
      for (const key of keys) {
        cancelSavedBadge(key);
        savedTimers.current.set(
          key,
          setTimeout(() => {
            savedTimers.current.delete(key);
            // Only the tick fades: a row that moved on to "saving" or "error"
            // in the meantime keeps whatever it says now.
            setStates((prev) => {
              const st = prev[key];
              if (!st || st.save !== "saved") return prev;
              return { ...prev, [key]: { ...st, save: "idle" } };
            });
          }, SAVED_BADGE_MS),
        );
      }
    },
    [cancelSavedBadge],
  );

  /** Autosave one row. Returns false when it did not reach the DB. */
  const save = useCallback(
    async (key: string): Promise<boolean> => {
      const st = statesRef.current[key];
      if (!st) return true;
      cancelSavedBadge(key);
      patch(key, { save: "saving", error: null });
      try {
        const res = await saveDraft({
          key,
          hy: st.values.hy,
          ru: st.values.ru,
          en: st.values.en,
          mark: st.mark,
          note: st.note,
        });
        if ("error" in res) {
          patch(key, { save: "error", error: res.error });
          return false;
        }
        markSaved([key]);
        return true;
      } catch {
        patch(key, { save: "error", error: "Не удалось сохранить — проверьте соединение" });
        return false;
      } finally {
        settle(key);
      }
    },
    [cancelSavedBadge, markSaved, patch, settle],
  );

  const scheduleSave = useCallback(
    (key: string) => {
      const running = timers.current.get(key);
      if (running) clearTimeout(running);
      cancelSavedBadge(key); // the row was touched again — no stale tick
      unsettled.current.add(key);
      setUnsettledCount(unsettled.current.size);
      timers.current.set(
        key,
        setTimeout(() => {
          timers.current.delete(key);
          void save(key);
        }, SAVE_DEBOUNCE_MS),
      );
    },
    [cancelSavedBadge, save],
  );

  /**
   * Send everything that hasn't reached the DB: rows still on their debounce
   * plus rows whose last save failed (so "Сохранить" retries them).
   */
  const flushPending = useCallback(async (): Promise<{ saved: string[]; failed: string[] }> => {
    const keys = new Set(timers.current.keys());
    for (const k of keys) {
      clearTimeout(timers.current.get(k)!);
      timers.current.delete(k);
    }
    for (const [key, st] of Object.entries(statesRef.current)) {
      if (st.save === "error") keys.add(key);
    }
    const done = await Promise.all([...keys].map(async (k) => ({ key: k, ok: await save(k) })));
    return {
      saved: done.filter((d) => d.ok).map((d) => d.key),
      failed: done.filter((d) => !d.ok).map((d) => d.key),
    };
  }, [save]);

  /* ── history: every edit goes through `edit`, so undo stays complete ──── */

  const historyRef = useRef(history);
  const commitHistory = useCallback((next: History) => {
    historyRef.current = next;
    setHistory(next);
  }, []);

  /**
   * Apply one change to one row: state, history step, autosave. `mutate` gets
   * the row as it is now and returns what it should become, or null when there
   * is nothing to change (then no step is recorded either).
   */
  const edit = useCallback(
    (kind: StepKind, key: string, mutate: (before: RowSnapshot) => RowSnapshot | null) => {
      const st = statesRef.current[key];
      if (!st) return;
      const before: RowSnapshot = { values: st.values, mark: st.mark, note: st.note };
      const after = mutate(before);
      if (!after) return;
      // A text edit invalidates a previous publish (the commit no longer matches
      // the row); a mark or a note doesn't touch what was committed.
      const textMoved = isChanged(after.values, before.values);
      const patchRow = (cur: RowState): RowState => ({
        ...cur,
        values: after.values,
        mark: after.mark,
        note: after.note,
        publishedAt: textMoved ? null : cur.publishedAt,
        save: "idle",
        error: null,
      });
      // Keep the ref in step right away, not only after the next commit: two
      // edits inside one tick must each see the previous one.
      statesRef.current = { ...statesRef.current, [key]: patchRow(st) };
      setStates((prev) => (prev[key] ? { ...prev, [key]: patchRow(prev[key]) } : prev));
      commitHistory(
        pushStep(historyRef.current, {
          kind,
          changes: [{ key, before, after }],
          at: Date.now(),
        }),
      );
      scheduleSave(key);
    },
    [commitHistory, scheduleSave],
  );

  const onValue = useCallback(
    (key: string, loc: Locale, value: string) => {
      edit({ type: "cell", key, loc }, key, (b) =>
        b.values[loc] === value ? null : { ...b, values: { ...b.values, [loc]: value } },
      );
    },
    [edit],
  );

  /** Colour switcher: clicking the active colour takes the mark off again. */
  const onMark = useCallback(
    (key: string, mark: Colour) => {
      edit({ type: "mark", key }, key, (b) => ({ ...b, mark: b.mark === mark ? "NONE" : mark }));
    },
    [edit],
  );

  const onNote = useCallback(
    (key: string, note: string) => {
      edit({ type: "note", key }, key, (b) => (b.note === note ? null : { ...b, note }));
    },
    [edit],
  );

  /** "Скопировать сюда из hy/ru/en" — same text or a starting point. */
  const onCopyFrom = useCallback(
    (key: string, from: Locale, to: Locale) => {
      edit({ type: "cell", key, loc: to }, key, (b) =>
        b.values[from] === b.values[to]
          ? null
          : { ...b, values: { ...b.values, [to]: b.values[from] } },
      );
    },
    [edit],
  );

  const codeByKey = useMemo(() => {
    const map = new Map<string, Values>();
    for (const r of rows) map.set(r.key, r.code);
    return map;
  }, [rows]);

  /** "Вернуть как в коде" — drops the whole working copy (text, note, mark). */
  const onRevert = useCallback(
    (key: string) => {
      const running = timers.current.get(key);
      if (running) {
        clearTimeout(running);
        timers.current.delete(key);
      }
      const code = codeByKey.get(key);
      const st = statesRef.current[key];
      if (!code || !st) return;
      const before: RowSnapshot = { values: st.values, mark: st.mark, note: st.note };
      const after: RowSnapshot = { values: { ...code }, mark: "NONE", note: "" };
      cancelSavedBadge(key);
      setStates((prev) => {
        const cur = prev[key];
        if (!cur) return prev;
        return {
          ...prev,
          [key]: { ...cur, ...after, publishedAt: null, save: "saving", error: null },
        };
      });
      commitHistory(
        pushStep(historyRef.current, {
          kind: { type: "revert", key },
          changes: [{ key, before, after }],
          at: Date.now(),
        }),
      );
      unsettled.current.add(key);
      setUnsettledCount(unsettled.current.size);
      void (async () => {
        try {
          await discardDraft(key);
          markSaved([key]);
        } catch {
          patch(key, { save: "error", error: "Не удалось отменить правку" });
        } finally {
          settle(key);
        }
      })();
    },
    [cancelSavedBadge, codeByKey, commitHistory, markSaved, patch, settle],
  );

  /* ── cell keyboard: Enter walks down, Esc undoes the current edit ─────── */

  // Value a cell had when the caret entered it — Esc restores exactly that.
  const focusSnapshot = useRef<{ key: string; loc: Locale; value: string } | null>(null);
  // Keys currently on screen, in display order (respects collapsed groups).
  const orderedKeysRef = useRef<string[]>([]);

  const onCellFocus = useCallback((key: string, loc: Locale, value: string) => {
    focusSnapshot.current = { key, loc, value };
  }, []);

  const onCellKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, key: string, loc: Locale) => {
      // Enter moves to the same locale one row down (Shift+Enter = line break).
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const keys = orderedKeysRef.current;
        const i = keys.indexOf(key);
        if (i >= 0 && i + 1 < keys.length) focusCell(keys[i + 1], loc);
        return;
      }
      if (e.key === "Escape") {
        const snap = focusSnapshot.current;
        if (snap && snap.key === key && snap.loc === loc && snap.value !== e.currentTarget.value) {
          e.preventDefault();
          onValue(key, loc, snap.value);
        }
      }
    },
    [onValue],
  );

  const onExpand = useCallback((key: string) => {
    setExpanded((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, []);

  const onToggleExpand = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }, []);

  /** "Сохранить": push everything that hasn't reached the DB and say what
   *  happened — the row ticks are easy to miss on a long list. */
  const onSaveAll = useCallback(async () => {
    setSavingAll(true);
    setResult(null);
    setNotice(null);
    try {
      const { saved, failed } = await flushPending();
      if (failed.length > 0) {
        const named = failed.slice(0, FAILED_KEYS_SHOWN).join(", ");
        const rest = failed.length - Math.min(failed.length, FAILED_KEYS_SHOWN);
        setNotice({
          tone: "error",
          text:
            `Не удалось сохранить: ${failed.length} ${plural(failed.length, "ключ", "ключа", "ключей")}` +
            ` (${named}${rest > 0 ? ` …и ещё ${rest}` : ""})` +
            (saved.length > 0 ? `. Сохранено: ${saved.length}` : ""),
        });
      } else if (saved.length > 0) {
        setNotice({
          tone: "ok",
          text: `Сохранено: ${saved.length} ${plural(saved.length, "ключ", "ключа", "ключей")}`,
        });
      } else {
        setNotice({ tone: "info", text: "Всё уже сохранено" });
      }
    } catch {
      setNotice({ tone: "error", text: "Не удалось сохранить — проверьте соединение" });
    } finally {
      setSavingAll(false);
    }
  }, [flushPending]);

  const onPublish = useCallback(async () => {
    setPublishing(true);
    setResult(null);
    setNotice(null);
    try {
      await flushPending();
      const res = await publishTranslations();
      setResult(res);
      if ("ok" in res) {
        // Published rows keep differing from the *running* build until the
        // Hostinger rebuild lands — mark them so the rows say so.
        const now = new Date().toISOString();
        setStates((prev) => {
          const next = { ...prev };
          for (const r of rows) {
            const st = next[r.key];
            if (st && isChanged(st.values, r.code)) {
              next[r.key] = { ...st, publishedAt: now, save: "idle", error: null };
            }
          }
          return next;
        });
      }
    } catch {
      setResult({ error: "Не удалось опубликовать — попробуйте ещё раз" });
    } finally {
      setPublishing(false);
    }
  }, [flushPending, rows]);

  // Warn before leaving while an edit is still queued or in flight.
  useEffect(() => {
    if (unsettledCount === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [unsettledCount]);

  const groups = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.context);
    return [...set].sort((a, b) => a.localeCompare(b, "ru"));
  }, [rows]);

  /* Validation is the only expensive per-keystroke work (regexes over three
     strings), so it runs for touched rows only — untouched ones came from the
     committed dictionary, which src/lib/i18n.guard.test.ts already proves valid
     — and its result is cached per key while the values object stays the same. */
  const issueCache = useRef(new Map<string, { values: Values; issues: ValidationIssue[] }>());
  const validate = useCallback((key: string, values: Values, code: Values) => {
    const hit = issueCache.current.get(key);
    if (hit && hit.values === values) return hit.issues;
    const issues = validateEntry(key, values, code);
    issueCache.current.set(key, { values, issues });
    return issues;
  }, []);

  const { changedKeys, pendingCount, awaitingCount, problemKeys, markCounts } = useMemo(() => {
    const changed = new Set<string>();
    const problem = new Set<string>();
    const marks: Record<Mark, number> = { NONE: 0, GREEN: 0, RED: 0, BLUE: 0 };
    let pending = 0;
    let awaiting = 0;
    for (const r of rows) {
      const st = states[r.key];
      if (!st) continue;
      marks[st.mark]++;
      const touched = r.draft !== null || st.mark !== "NONE" || st.note !== "";
      if (isChanged(st.values, r.code)) {
        changed.add(r.key);
        if (st.publishedAt === null) pending++;
        else awaiting++;
        if (validate(r.key, st.values, r.code).length > 0) problem.add(r.key);
      } else if (touched && validate(r.key, st.values, r.code).length > 0) {
        problem.add(r.key);
      }
    }
    return {
      changedKeys: changed,
      pendingCount: pending,
      awaitingCount: awaiting,
      problemKeys: problem,
      markCounts: marks,
    };
  }, [rows, states, validate]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const wantMark = CHIP_MARK[chip];
    return rows.filter((r) => {
      const st = states[r.key];
      if (!st) return false;
      if (group !== ALL_GROUPS && r.context !== group) return false;
      if (chip === "changed" && !changedKeys.has(r.key)) return false;
      if (chip === "problem" && !problemKeys.has(r.key)) return false;
      if (wantMark && st.mark !== wantMark) return false;
      if (q) {
        const haystack = `${r.key}\n${st.values.hy}\n${st.values.ru}\n${st.values.en}`;
        if (!haystack.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, states, search, group, chip, changedKeys, problemKeys]);

  const shownCount = Math.min(limit, filtered.length);
  const hasMore = shownCount < filtered.length;
  const shown = useMemo(() => filtered.slice(0, shownCount), [filtered, shownCount]);

  /* Grow the list as the sentinel below it comes into view. The observer is
     rebuilt after each growth on purpose: a fresh observer reports a target that
     is *already* visible, so a tall screen keeps filling instead of stalling
     until the next scroll. */
  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setLimit((l) => l + PAGE_SIZE);
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, shownCount]);

  /* Grouping is a view over what's loaded (filter → load → group), so a section
     shows the rows of it that are on screen. */
  const sections = useMemo(() => {
    if (group !== ALL_GROUPS) return null;
    const byContext = new Map<string, TranslationRow[]>();
    for (const r of shown) {
      const bucket = byContext.get(r.context);
      if (bucket) bucket.push(r);
      else byContext.set(r.context, [r]);
    }
    return [...byContext].map(([context, list]) => ({ context, rows: list }));
  }, [shown, group]);

  const orderedKeys = useMemo(() => {
    if (!sections) return shown.map((r) => r.key);
    const out: string[] = [];
    for (const s of sections) {
      if (!collapsed.has(s.context)) out.push(...s.rows.map((r) => r.key));
    }
    return out;
  }, [sections, shown, collapsed]);

  useEffect(() => {
    orderedKeysRef.current = orderedKeys;
  }, [orderedKeys]);

  const onToggleGroup = useCallback((context: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(context)) next.add(context);
      return next;
    });
  }, []);

  /* Every section of the FILTERED set, not just the loaded chunk — "свернуть
     всё" has to cover the groups infinite scroll hasn't reached yet, otherwise
     scrolling right after it pours expanded groups back in (QA 2026-07-26). */
  const allContexts = useMemo(() => {
    const set = new Set<string>();
    for (const r of filtered) set.add(r.context);
    return [...set];
  }, [filtered]);

  const collapseAll = useCallback(() => {
    setCollapsed(new Set(allContexts));
    // Collapsed sections take almost no height, so start the list over instead
    // of keeping hundreds of hidden rows loaded.
    setLimit(PAGE_SIZE);
  }, [allContexts]);

  /* ── CSV panel plumbing (stable getters: they read the refs) ──────────── */

  const filteredRef = useRef(filtered);
  useEffect(() => {
    filteredRef.current = filtered;
  }, [filtered]);

  const toTransferRow = (r: TranslationRow, st: RowState): TransferRow => ({
    key: r.key,
    context: r.context,
    values: st.values,
    mark: st.mark,
    note: st.note,
  });

  const getVisibleRows = useCallback((): TransferRow[] => {
    const st = statesRef.current;
    return filteredRef.current.filter((r) => st[r.key]).map((r) => toTransferRow(r, st[r.key]));
  }, []);

  const getAllRows = useCallback((): Map<string, TransferRow> => {
    const st = statesRef.current;
    const map = new Map<string, TransferRow>();
    for (const r of rows) if (st[r.key]) map.set(r.key, toTransferRow(r, st[r.key]));
    return map;
  }, [rows]);

  /**
   * Write a set of row snapshots to the DB in batches — used by the CSV import
   * and by undoing/redoing it. `saveDraftsBulk` drops a row whose snapshot is
   * back to the committed values with no mark and no note, so an undone import
   * leaves no leftovers.
   */
  const persistSnapshots = useCallback(
    async (
      targets: { key: string; snap: RowSnapshot }[],
      onProgress?: (done: number, total: number) => void,
    ): Promise<number> => {
      let failed = 0;
      for (let i = 0; i < targets.length; i += BULK_BATCH) {
        const batch = targets.slice(i, i + BULK_BATCH);
        const inputs: SaveDraftInput[] = batch.map(({ key, snap }) => ({
          key,
          hy: snap.values.hy,
          ru: snap.values.ru,
          en: snap.values.en,
          mark: snap.mark,
          note: snap.note,
        }));
        let error: string | null = null;
        try {
          const res = await saveDraftsBulk(inputs);
          if ("error" in res) error = res.error;
        } catch {
          error = "Не удалось сохранить — проверьте соединение";
        }
        if (error) {
          failed += batch.length;
          const message = error;
          setStates((prev) => {
            const next = { ...prev };
            for (const { key } of batch) {
              const st = next[key];
              if (st) next[key] = { ...st, save: "error", error: message };
            }
            return next;
          });
        } else {
          markSaved(batch.map((b) => b.key));
        }
        for (const { key } of batch) unsettled.current.delete(key);
        setUnsettledCount(unsettled.current.size);
        onProgress?.(Math.min(i + batch.length, targets.length), targets.length);
      }
      return failed;
    },
    [markSaved],
  );

  /** Apply an accepted CSV import: state first (so the rows repaint at once),
   *  then batched saves with progress. The whole import is one undo step. */
  const applyImport = useCallback(
    async (changes: ImportChange[], onProgress: (done: number, total: number) => void) => {
      const steps: RowChange[] = [];
      for (const c of changes) {
        const running = timers.current.get(c.key);
        if (running) {
          clearTimeout(running);
          timers.current.delete(c.key);
        }
        cancelSavedBadge(c.key);
        unsettled.current.add(c.key);
        const st = statesRef.current[c.key];
        if (st) {
          steps.push({
            key: c.key,
            before: { values: st.values, mark: st.mark, note: st.note },
            after: { values: c.values, mark: c.mark, note: c.note },
          });
        }
      }
      setUnsettledCount(unsettled.current.size);

      setStates((prev) => {
        const next = { ...prev };
        for (const c of changes) {
          const st = next[c.key];
          if (!st) continue;
          const textMoved = c.diffs.some((d) => d.field !== "mark" && d.field !== "note");
          next[c.key] = {
            ...st,
            values: c.values,
            mark: c.mark,
            note: c.note,
            publishedAt: textMoved ? null : st.publishedAt,
            save: "saving",
            error: null,
          };
        }
        return next;
      });
      commitHistory(
        pushStep(historyRef.current, {
          kind: { type: "import", count: steps.length },
          changes: steps,
          at: Date.now(),
        }),
      );

      const targets = changes.map((c) => ({
        key: c.key,
        snap: { values: c.values, mark: c.mark, note: c.note },
      }));
      const failed = await persistSnapshots(targets, onProgress);
      return { saved: changes.length - failed, failed };
    },
    [cancelSavedBadge, commitHistory, persistSnapshots],
  );

  /* ── undo / redo ──────────────────────────────────────────────────────── */

  /** Replay one history step, in one direction, all the way into the DB. */
  const runStep = useCallback(
    async (step: Step, dir: "undo" | "redo") => {
      const targets = step.changes.map((c) => ({
        key: c.key,
        snap: dir === "undo" ? c.before : c.after,
      }));
      if (targets.length === 0) return;

      for (const { key } of targets) {
        const running = timers.current.get(key);
        if (running) {
          clearTimeout(running);
          timers.current.delete(key);
        }
        cancelSavedBadge(key);
        unsettled.current.add(key);
      }
      setUnsettledCount(unsettled.current.size);

      setStates((prev) => {
        const next = { ...prev };
        for (const { key, snap } of targets) {
          const cur = next[key];
          if (!cur) continue;
          next[key] = {
            ...cur,
            values: snap.values,
            mark: snap.mark,
            note: snap.note,
            publishedAt: isChanged(snap.values, cur.values) ? null : cur.publishedAt,
            save: "saving",
            error: null,
          };
        }
        return next;
      });

      // One row goes through the plain single-row path, which can also drop the
      // working copy outright when the restored state is what the code has.
      if (targets.length === 1) {
        const { key, snap } = targets[0];
        const code = codeByKey.get(key);
        const bare =
          code !== undefined &&
          !isChanged(snap.values, code) &&
          snap.note === "" &&
          snap.mark === "NONE";
        try {
          if (bare) {
            await discardDraft(key);
          } else {
            const res = await saveDraft({
              key,
              hy: snap.values.hy,
              ru: snap.values.ru,
              en: snap.values.en,
              mark: snap.mark,
              note: snap.note,
            });
            if ("error" in res) throw new Error(res.error);
          }
          markSaved([key]);
        } catch (e) {
          patch(key, {
            save: "error",
            error: e instanceof Error && e.message ? e.message : "Не удалось сохранить",
          });
        } finally {
          settle(key);
        }
        return;
      }

      setStepProgress({ done: 0, total: targets.length });
      const failed = await persistSnapshots(targets, (done, total) =>
        setStepProgress({ done, total }),
      );
      setStepProgress(null);
      if (failed > 0) {
        setNotice({
          tone: "error",
          text: `Не удалось сохранить: ${failed} ${plural(failed, "ключ", "ключа", "ключей")} — нажмите «Сохранить»`,
        });
      }
    },
    [cancelSavedBadge, codeByKey, markSaved, patch, persistSnapshots, settle],
  );

  const busy = publishing || savingAll || stepProgress !== null;

  const onUndo = useCallback(() => {
    const res = undoStep(historyRef.current);
    if (!res) return;
    commitHistory(res.history);
    setResult(null);
    setNotice({ tone: "info", text: `Отменено: ${stepLabel(res.step)}` });
    void runStep(res.step, "undo");
  }, [commitHistory, runStep]);

  const onRedo = useCallback(() => {
    const res = redoStep(historyRef.current);
    if (!res) return;
    commitHistory(res.history);
    setResult(null);
    setNotice({ tone: "info", text: `Возвращено: ${stepLabel(res.step)}` });
    void runStep(res.step, "redo");
  }, [commitHistory, runStep]);

  /* Ctrl+S — save everything pending; Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y — history.
     Caught on window (even with the caret in a cell) and preventDefault'ed: one
     predictable "назад" beats mixing ours with the textarea's own undo. */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        void onSaveAll();
      } else if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        onRedo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSaveAll, onUndo, onRedo]);

  /** Jump straight to one key (used by the error list under the header). */
  const focusKey = useCallback((key: string) => {
    setSearch(key);
    setGroup(ALL_GROUPS);
    setChip("all");
    setLimit(PAGE_SIZE);
  }, []);

  const canPublish = configured && pendingCount > 0 && !busy;
  const publishTitle = !configured
    ? "Не задан GITHUB_SYNC_TOKEN"
    : pendingCount === 0
      ? "Нет неопубликованных изменений"
      : `Коммит в ${repo}`;
  const publishError = result && "error" in result ? result : null;
  const publishOk = result && "ok" in result ? result : null;
  const dense = density === "compact";
  const undoNext = history.past[history.past.length - 1];
  const redoNext = history.future[0];

  const rowProps = {
    dense,
    onValue,
    onMark,
    onNote,
    onRevert,
    onCellFocus,
    onCellKeyDown,
    onCopyFrom,
    onExpand,
    onToggleExpand,
    validate,
  };

  return (
    <div className="mt-6" style={{ "--i18n-head-top": `${headTop}px` } as React.CSSProperties}>
      {/* Sticky action bar — top-16 clears the fixed mobile top bar. */}
      <div
        ref={barRef}
        className="sticky top-16 z-20 -mx-4 border-y border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:top-0 md:-mx-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {pendingCount > 0 ? `Изменено: ${pendingCount}` : "Изменений нет"}
              {awaitingCount > 0 && (
                <span className="ml-2 font-normal text-warn">ждут сборки: {awaitingCount}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              После публикации сайт пересобирается примерно 5 минут.
              {lastPublish && (
                <>
                  {" "}
                  Последняя публикация: <When iso={lastPublish.at} />, {lastPublish.by},{" "}
                  {lastPublish.keyCount} ключ(ей){" "}
                  <a
                    href={lastPublish.commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    коммит
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {stepProgress && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                применяю: {stepProgress.done} / {stepProgress.total}
              </span>
            )}

            <button
              type="button"
              onClick={onUndo}
              disabled={!undoNext || busy}
              aria-label="Назад"
              title={
                undoNext
                  ? `Назад: ${stepLabel(undoNext)} · шагов: ${history.past.length} (Ctrl+Z)`
                  : "Отменять нечего"
              }
              className={stepBtnClass}
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!redoNext || busy}
              aria-label="Вперёд"
              title={
                redoNext
                  ? `Вперёд: ${stepLabel(redoNext)} · шагов: ${history.future.length} (Ctrl+Shift+Z)`
                  : "Возвращать нечего"
              }
              className={stepBtnClass}
            >
              <Redo2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onSaveAll}
              disabled={busy}
              title="Досохранить всё, что ещё не ушло на сервер (Ctrl+S)"
              className={secondaryBtnClass}
            >
              {savingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {savingAll ? "Сохраняю…" : "Сохранить"}
            </button>

            <button
              type="button"
              onClick={onPublish}
              disabled={!canPublish}
              title={publishTitle}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CloudUpload className="h-4 w-4" />
              )}
              {publishing ? "Публикую…" : "Опубликовать"}
            </button>
          </div>
        </div>

        {notice && (
          <div
            className={`mt-3 flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
              notice.tone === "ok"
                ? "border-success/40 bg-success/10 text-success"
                : notice.tone === "error"
                  ? "border-danger/40 bg-danger/10 text-danger"
                  : "border-border bg-muted text-muted-foreground"
            }`}
          >
            <p>{notice.text}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Закрыть"
              className="cursor-pointer opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {publishOk && (
          <div className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
            <p>
              Опубликовано: {publishOk.keyCount}{" "}
              {plural(publishOk.keyCount, "ключ", "ключа", "ключей")}. Сайт пересоберётся примерно
              за 5 минут.{" "}
              <a
                href={publishOk.commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline"
              >
                коммит
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
            <button
              type="button"
              onClick={() => setResult(null)}
              aria-label="Закрыть"
              className="cursor-pointer opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {publishError && (
          <div className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            <div className="flex items-start justify-between gap-3">
              <p>{publishError.error}</p>
              <button
                type="button"
                onClick={() => setResult(null)}
                aria-label="Закрыть"
                className="cursor-pointer opacity-70 transition-opacity hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {publishError.issues && publishError.issues.length > 0 && (
              <ul className="mt-2 space-y-1">
                {publishError.issues.map((issue, i) => (
                  <li key={`${issue.key}-${i}`}>
                    <button
                      type="button"
                      onClick={() => focusKey(issue.key)}
                      className="cursor-pointer font-mono text-xs underline"
                    >
                      {issue.key}
                    </button>{" "}
                    — {issue.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setLimit(PAGE_SIZE);
              }}
              placeholder="Поиск по ключу или тексту"
              className={`${fieldClass} border-border pl-9`}
            />
          </label>
          <select
            value={group}
            onChange={(e) => {
              setGroup(e.target.value);
              setLimit(PAGE_SIZE);
            }}
            className={`${fieldClass} w-auto max-w-72 border-border`}
          >
            <option value={ALL_GROUPS}>Все разделы сайта</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <Toggle
            value={view}
            onChange={(v) => {
              setView(v);
              setLimit(PAGE_SIZE);
            }}
            options={[
              { value: "table", label: "Таблица" },
              { value: "cards", label: "Карточки" },
            ]}
          />
          <Toggle
            value={density}
            onChange={setDensity}
            options={[
              { value: "compact", label: "Компактно" },
              { value: "normal", label: "Обычно" },
            ]}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {CHIPS.map((c) => {
            const wantMark = CHIP_MARK[c.value];
            const count =
              c.value === "changed"
                ? changedKeys.size
                : c.value === "problem"
                  ? problemKeys.size
                  : wantMark
                    ? markCounts[wantMark]
                    : 0;
            const active = chip === c.value;
            const colour = wantMark && wantMark !== "NONE" ? MARK_META[wantMark].chip : null;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setChip(c.value);
                  setLimit(PAGE_SIZE);
                }}
                className={`${chipClass} ${
                  active
                    ? (colour ?? "border-primary/40 bg-primary/10 text-primary")
                    : "border-border bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
                {count > 0 && ` (${count})`}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Метки:{" "}
          {MARK_LIST.map((m, i) => (
            <span key={m}>
              {i > 0 && " · "}
              {MARK_META[m].emoji} {MARK_META[m].hint}
            </span>
          ))}{" "}
          · без метки — не трогали
        </p>

        <div className="mt-3 border-t border-border pt-3">
          <CsvTransfer
            count={filtered.length}
            getVisibleRows={getVisibleRows}
            getAllRows={getAllRows}
            onApply={applyImport}
          />
        </div>
      </div>

      {/* Rows */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Найдено ключей: {filtered.length}</p>
        {sections && sections.length > 1 && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={collapseAll} className={iconBtnClass}>
              Свернуть всё
            </button>
            <button
              type="button"
              onClick={() => setCollapsed(new Set())}
              className={iconBtnClass}
            >
              Развернуть всё
            </button>
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="mt-3 rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Ничего не найдено — измените фильтры.
        </p>
      ) : view === "table" ? (
        // No scroll container here on purpose. A pane with its own overflow
        // captures the mouse wheel, so scrolling the 855-row list felt dead
        // while the page itself still had 400px to go. The page is the single
        // vertical scroller; the header pins to the viewport via
        // --i18n-head-top. Below lg the table keeps a minimum width and scrolls
        // sideways (that pane then owns the wheel only horizontally, since it
        // has no height cap and can never scroll vertically); from lg up it
        // fits, so overflow-x-clip keeps even that container out of the way.
        <div className="mt-3 overflow-x-auto rounded-xl border border-border lg:overflow-x-clip">
          <table className="w-full min-w-[64rem] table-fixed border-separate border-spacing-0 lg:min-w-0">
            <thead>
              <tr>
                <th className={`${thClass} sticky left-0 z-20 w-64 border-r`}>Ключ</th>
                {EDIT_LOCALES.map(({ loc, label }) => (
                  <th key={loc} className={thClass}>
                    {label} <span className="font-mono">({loc})</span>
                  </th>
                ))}
                <th className={`${thClass} w-24`}>Метка</th>
                <th className={`${thClass} w-24`} />
              </tr>
            </thead>
            {sections
              ? sections.map((s) => (
                  <tbody key={s.context}>
                    <GroupHeader
                      context={s.context}
                      rows={s.rows}
                      states={states}
                      changedKeys={changedKeys}
                      collapsed={collapsed.has(s.context)}
                      onToggle={onToggleGroup}
                      asTableRow
                    />
                    {!collapsed.has(s.context) &&
                      s.rows.map((row) => (
                        <TableRow
                          key={row.key}
                          row={row}
                          state={states[row.key]}
                          expanded={expanded.has(row.key)}
                          {...rowProps}
                        />
                      ))}
                  </tbody>
                ))
              : (
                  <tbody>
                    {shown.map((row) => (
                      <TableRow
                        key={row.key}
                        row={row}
                        state={states[row.key]}
                        expanded={expanded.has(row.key)}
                        {...rowProps}
                      />
                    ))}
                  </tbody>
                )}
          </table>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {sections
            ? sections.map((s) => (
                <div key={s.context} className="flex flex-col gap-3">
                  <GroupHeader
                    context={s.context}
                    rows={s.rows}
                    states={states}
                    changedKeys={changedKeys}
                    collapsed={collapsed.has(s.context)}
                    onToggle={onToggleGroup}
                  />
                  {!collapsed.has(s.context) &&
                    s.rows.map((row) => (
                      <CardRow
                        key={row.key}
                        row={row}
                        state={states[row.key]}
                        expanded={expanded.has(row.key)}
                        {...rowProps}
                      />
                    ))}
                </div>
              ))
            : shown.map((row) => (
                <CardRow
                  key={row.key}
                  row={row}
                  state={states[row.key]}
                  expanded={expanded.has(row.key)}
                  {...rowProps}
                />
              ))}
        </div>
      )}

      {/* Sentinel + counter: the list grows as this comes into view. */}
      {hasMore && <div ref={sentinel} aria-hidden className="h-8" />}
      {filtered.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs text-muted-foreground">
            Показано {shownCount} из {filtered.length}
          </span>
          {hasMore && (
            <button
              type="button"
              onClick={() => setLimit(filtered.length)}
              title="Показать все строки сразу — тогда работает поиск браузером (Ctrl+F)"
              className={iconBtnClass}
            >
              Показать все
            </button>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Enter — вниз по колонке, Shift+Enter — перенос строки, Esc — вернуть значение ячейки,
        Ctrl+S — сохранить всё, Ctrl+Z — назад, Ctrl+Shift+Z — вперёд, двойной клик — раскрыть
        строку.
      </p>
    </div>
  );
}

/** Two- or three-way segmented switch (вид, плотность). */
function Toggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            value === o.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
