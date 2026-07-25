"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { isChanged, validateEntry, type ValidationIssue, type Values } from "@/lib/i18n-validate";
import { MARK_LIST, MARK_META, type Colour, type Mark } from "./mark";
import { CsvTransfer } from "./csv-transfer";
import type { ImportChange, TransferRow } from "./csv-io";
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
   autosaved as a UiDraft, with a single "Сохранить и опубликовать" button that
   commits every changed row.

   Two views over the same state: a spreadsheet-like table (default — Мариам
   came from a Google Sheet) and the roomier card list. 855 rows is too many to
   paint at once, so rows are filtered + paginated to PAGE_SIZE and each row is
   memoized: a keystroke re-renders only its own row. Validation runs locally
   (the rules in src/lib/i18n-validate.ts are pure) so a red hint appears as you
   type, before the debounced save round-trips. */

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

const PAGE_SIZE = 50;
const SAVE_DEBOUNCE_MS = 700;
const ALL_GROUPS = "__all__";
/** Rows per saveDraftsBulk call during a CSV import (keeps the payload small
 *  and the progress bar moving). */
const BULK_BATCH = 20;

const chipClass =
  "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors";

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
  const [page, setPage] = useState(1);
  const [view, setView] = useState<View>("table");
  const [density, setDensity] = useState<Density>("compact");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);

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

  const patch = useCallback((key: string, part: Partial<RowState>) => {
    setStates((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], ...part } } : prev));
  }, []);

  const settle = useCallback((key: string) => {
    unsettled.current.delete(key);
    setUnsettledCount(unsettled.current.size);
  }, []);

  const save = useCallback(
    async (key: string) => {
      const st = statesRef.current[key];
      if (!st) return;
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
        if ("error" in res) patch(key, { save: "error", error: res.error });
        else patch(key, { save: "saved", error: null });
      } catch {
        patch(key, { save: "error", error: "Не удалось сохранить — проверьте соединение" });
      } finally {
        settle(key);
      }
    },
    [patch, settle],
  );

  const scheduleSave = useCallback(
    (key: string) => {
      const running = timers.current.get(key);
      if (running) clearTimeout(running);
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
    [save],
  );

  /** Send every still-debounced row now (before publishing, on Ctrl+S). */
  const flushPending = useCallback(async () => {
    const keys = [...timers.current.keys()];
    for (const k of keys) {
      clearTimeout(timers.current.get(k)!);
      timers.current.delete(k);
    }
    await Promise.all(keys.map((k) => save(k)));
  }, [save]);

  const onValue = useCallback(
    (key: string, loc: Locale, value: string) => {
      setStates((prev) => {
        const st = prev[key];
        if (!st) return prev;
        return {
          ...prev,
          // A text edit invalidates a previous publish: the commit no longer
          // matches what's in the row.
          [key]: {
            ...st,
            values: { ...st.values, [loc]: value },
            publishedAt: null,
            save: "idle",
            error: null,
          },
        };
      });
      scheduleSave(key);
    },
    [scheduleSave],
  );

  /** Colour switcher: clicking the active colour takes the mark off again. */
  const onMark = useCallback(
    (key: string, mark: Colour) => {
      setStates((prev) => {
        const st = prev[key];
        if (!st) return prev;
        return {
          ...prev,
          [key]: { ...st, mark: st.mark === mark ? "NONE" : mark, save: "idle", error: null },
        };
      });
      scheduleSave(key);
    },
    [scheduleSave],
  );

  const onNote = useCallback(
    (key: string, note: string) => {
      setStates((prev) => {
        const st = prev[key];
        if (!st) return prev;
        return { ...prev, [key]: { ...st, note, save: "idle" } };
      });
      scheduleSave(key);
    },
    [scheduleSave],
  );

  /** "Скопировать сюда из hy/ru/en" — same text or a starting point. */
  const onCopyFrom = useCallback(
    (key: string, from: Locale, to: Locale) => {
      setStates((prev) => {
        const st = prev[key];
        if (!st || st.values[from] === st.values[to]) return prev;
        return {
          ...prev,
          [key]: {
            ...st,
            values: { ...st.values, [to]: st.values[from] },
            publishedAt: null,
            save: "idle",
            error: null,
          },
        };
      });
      scheduleSave(key);
    },
    [scheduleSave],
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
      if (!code) return;
      setStates((prev) => {
        const st = prev[key];
        if (!st) return prev;
        return {
          ...prev,
          [key]: {
            ...st,
            values: { ...code },
            note: "",
            mark: "NONE",
            publishedAt: null,
            save: "saving",
            error: null,
          },
        };
      });
      unsettled.current.add(key);
      setUnsettledCount(unsettled.current.size);
      void (async () => {
        try {
          await discardDraft(key);
          patch(key, { save: "saved", error: null });
        } catch {
          patch(key, { save: "error", error: "Не удалось отменить правку" });
        } finally {
          settle(key);
        }
      })();
    },
    [codeByKey, patch, settle],
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

  const onPublish = useCallback(async () => {
    setPublishing(true);
    setResult(null);
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

  // Ctrl+S / ⌘S — save everything still waiting on its debounce.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "s") return;
      e.preventDefault();
      void flushPending();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flushPending]);

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

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const shown = useMemo(
    () => filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [filtered, current],
  );

  /* Grouping is a view over the current page (filter → paginate → group), so
     the page always holds PAGE_SIZE rows no matter how they split up. */
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

  const collapseAll = useCallback(() => {
    setCollapsed(new Set((sections ?? []).map((s) => s.context)));
  }, [sections]);

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

  /** Apply an accepted CSV import: state first (so the rows repaint at once),
   *  then batched saves with progress. */
  const applyImport = useCallback(
    async (changes: ImportChange[], onProgress: (done: number, total: number) => void) => {
      for (const c of changes) {
        const running = timers.current.get(c.key);
        if (running) {
          clearTimeout(running);
          timers.current.delete(c.key);
        }
        unsettled.current.add(c.key);
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

      let failed = 0;
      for (let i = 0; i < changes.length; i += BULK_BATCH) {
        const batch = changes.slice(i, i + BULK_BATCH);
        const inputs: SaveDraftInput[] = batch.map((c) => ({
          key: c.key,
          hy: c.values.hy,
          ru: c.values.ru,
          en: c.values.en,
          mark: c.mark,
          note: c.note,
        }));
        let error: string | null = null;
        try {
          const res = await saveDraftsBulk(inputs);
          if ("error" in res) error = res.error;
        } catch {
          error = "Не удалось сохранить — проверьте соединение";
        }
        if (error) failed += batch.length;
        setStates((prev) => {
          const next = { ...prev };
          for (const c of batch) {
            const st = next[c.key];
            if (!st) continue;
            next[c.key] = error
              ? { ...st, save: "error", error }
              : { ...st, save: "saved", error: null };
          }
          return next;
        });
        for (const c of batch) unsettled.current.delete(c.key);
        setUnsettledCount(unsettled.current.size);
        onProgress(Math.min(i + batch.length, changes.length), changes.length);
      }
      return { saved: changes.length - failed, failed };
    },
    [],
  );

  /** Jump straight to one key (used by the error list under the header). */
  const focusKey = useCallback((key: string) => {
    setSearch(key);
    setGroup(ALL_GROUPS);
    setChip("all");
    setPage(1);
  }, []);

  const canPublish = configured && pendingCount > 0 && !publishing;
  const publishError = result && "error" in result ? result : null;
  const publishOk = result && "ok" in result ? result : null;
  const dense = density === "compact";

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
    <div className="mt-6">
      {/* Sticky action bar — top-16 clears the fixed mobile top bar. */}
      <div className="sticky top-16 z-20 -mx-4 border-y border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:top-0 md:-mx-6">
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

          <button
            type="button"
            onClick={onPublish}
            disabled={!canPublish}
            title={configured ? `Коммит в ${repo}` : "Не задан GITHUB_SYNC_TOKEN"}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CloudUpload className="h-4 w-4" />
            )}
            {publishing ? "Публикую…" : "Сохранить и опубликовать"}
          </button>
        </div>

        {publishOk && (
          <p className="mt-3 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
            Опубликовано ключей: {publishOk.keyCount}. Сайт пересобирается — новые тексты появятся
            через ~5 минут.{" "}
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
        )}
        {publishError && (
          <div className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            <p>{publishError.error}</p>
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
                setPage(1);
              }}
              placeholder="Поиск по ключу или тексту"
              className={`${fieldClass} border-border pl-9`}
            />
          </label>
          <select
            value={group}
            onChange={(e) => {
              setGroup(e.target.value);
              setPage(1);
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
            onChange={setView}
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
                  setPage(1);
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
        <p className="text-xs text-muted-foreground">
          Найдено ключей: {filtered.length}
          {filtered.length > PAGE_SIZE &&
            ` — показаны ${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, filtered.length)}`}
        </p>
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
        // Both scrollbars belong to this pane: the page never scrolls
        // sideways, and the header/key column stay pinned inside it.
        <div className="mt-3 max-h-[70vh] overflow-auto rounded-xl border border-border">
          <table className="w-full min-w-[70rem] border-separate border-spacing-0">
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

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
            className={`${iconBtnClass} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <ChevronLeft className="h-4 w-4" />
            Назад
          </button>
          <span className="text-xs text-muted-foreground">
            Страница {current} из {pageCount}
          </span>
          <button
            type="button"
            disabled={current === pageCount}
            onClick={() => setPage(current + 1)}
            className={`${iconBtnClass} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            Вперёд
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Enter — вниз по колонке, Shift+Enter — перенос строки, Esc — вернуть значение ячейки,
        Ctrl+S — сохранить всё сразу, двойной клик — раскрыть строку.
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
