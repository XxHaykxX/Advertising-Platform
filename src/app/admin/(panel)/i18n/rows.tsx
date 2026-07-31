"use client";

import { memo, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Maximize2,
  MessageSquare,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import { LOCALES, type Locale } from "@/lib/i18n-client";
import { isChanged, type ValidationIssue, type Values } from "@/lib/i18n-validate";
import { MARK_LIST, MARK_META, type Colour, type Mark } from "./mark";
import {
  EDIT_LOCALES,
  LOCALE_SHORT,
  TABLE_COLS,
  chipClass,
  fieldClass,
  iconBtnClass,
  squareBtnClass,
} from "./ui";

/* One dictionary key, in the two views the editor offers: a spreadsheet row
   (default — Мариам came from a Google Sheet) and the roomier card.

   Both are memoized: the editor re-renders on every keystroke, but only the
   edited row's `state` identity changes, so 855 keys stay cheap. Everything
   they need arrives as props — the state itself lives in translations-editor. */

export type TranslationRow = {
  key: string;
  context: string;
  /** Values as committed in src/lib/i18n.ts (this deploy). */
  code: Values;
  /** Working copy, when the translator has touched this key. */
  draft: Values | null;
  mark: Mark;
  note: string;
  publishedAt: string | null;
  dirty: boolean;
};

export type SaveState = "idle" | "saving" | "saved" | "error";

export type RowState = {
  values: Values;
  mark: Mark;
  note: string;
  publishedAt: string | null;
  save: SaveState;
  error: string | null;
};

export type RowCallbacks = {
  /** Compact = one line per cell until the caret enters or the row is opened. */
  dense: boolean;
  onValue: (key: string, loc: Locale, value: string) => void;
  onMark: (key: string, mark: Colour) => void;
  onNote: (key: string, note: string) => void;
  onRevert: (key: string) => void;
  onCellFocus: (key: string, loc: Locale, value: string) => void;
  onCellKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>, key: string, loc: Locale) => void;
  onCopyFrom: (key: string, from: Locale, to: Locale) => void;
  onExpand: (key: string) => void;
  onToggleExpand: (key: string) => void;
  validate: (key: string, values: Values, code: Values) => ValidationIssue[];
};

export type RowProps = RowCallbacks & {
  row: TranslationRow;
  state: RowState;
  expanded: boolean;
};

/** Spreadsheet row: ключ | hy | ru | en | метка | ⋯ (+ a note row when open). */
export const TableRow = memo(function TableRow(props: RowProps) {
  const { row, state, expanded, dense, onMark, onNote, onRevert, onToggleExpand, validate } = props;
  const [noteOpen, setNoteOpen] = useState(() => state.note !== "");
  const changed = isChanged(state.values, row.code);
  const issues = validate(row.key, state.values, row.code);
  const awaitingBuild = state.publishedAt !== null && changed;
  const tint = state.mark === "NONE" ? "" : MARK_META[state.mark].tint;
  const stripe = state.mark === "NONE" ? "border-l-transparent" : MARK_META[state.mark].stripe;
  const cell = `border-b border-border px-2 py-1.5 align-top ${tint}`;
  // Opaque bg-card: the key column is pinned and the text scrolls under it.
  const keyCell = `sticky left-0 z-10 border-b border-r border-l-4 border-border bg-card align-top ${stripe}`;

  return (
    <>
      <tr>
        <td className={`${keyCell} px-3 py-1.5`}>
          <p className="truncate font-mono text-xs text-muted-foreground" title={row.key}>
            {row.key}
          </p>
          <Marker state={state} awaitingBuild={awaitingBuild} compact />
        </td>
        {EDIT_LOCALES.map(({ loc }) => (
          <td key={loc} className={cell}>
            <Cell {...props} loc={loc} issues={issues} compact={dense && !expanded} padForMenu />
          </td>
        ))}
        <td className={cell}>
          <MarkPicker rowKey={row.key} mark={state.mark} onMark={onMark} />
        </td>
        <td className={cell}>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onToggleExpand(row.key)}
              title={expanded ? "Свернуть строку" : "Раскрыть строку"}
              className={squareBtnClass}
            >
              {expanded ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setNoteOpen((v) => !v)}
              title="Заметка"
              className={`${squareBtnClass} ${state.note ? "border-primary/40 text-primary" : ""}`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
            {changed && (
              <button
                type="button"
                onClick={() => onRevert(row.key)}
                title="Вернуть значения, которые сейчас в коде"
                className={squareBtnClass}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </td>
      </tr>
      {noteOpen && (
        <tr>
          <td className={keyCell} />
          <td colSpan={TABLE_COLS - 1} className={`border-b border-border px-2 pb-2 ${tint}`}>
            <textarea
              rows={2}
              value={state.note}
              onChange={(e) => onNote(row.key, e.target.value)}
              placeholder="Заметка (видна только в админке)"
              className={`${fieldClass} field-sizing-content min-h-14 resize-y border-border`}
            />
          </td>
        </tr>
      )}
    </>
  );
});

/** Roomier card view of the same row — kept for long texts and small screens. */
export const CardRow = memo(function CardRow(props: RowProps) {
  const { row, state, expanded, dense, onMark, onNote, onRevert, onToggleExpand, validate } = props;
  const [noteOpen, setNoteOpen] = useState(() => state.note !== "");
  const changed = isChanged(state.values, row.code);
  const issues = validate(row.key, state.values, row.code);
  const awaitingBuild = state.publishedAt !== null && changed;
  const accent =
    state.mark === "NONE"
      ? "border-l-transparent"
      : `${MARK_META[state.mark].stripe} ${MARK_META[state.mark].tint}`;

  return (
    <div className={`rounded-xl border border-l-4 border-border bg-card p-4 ${accent}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs text-muted-foreground">{row.key}</p>
          <p className="text-xs text-foreground/70">{row.context}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Marker state={state} awaitingBuild={awaitingBuild} />
          <MarkPicker rowKey={row.key} mark={state.mark} onMark={onMark} />

          <button
            type="button"
            onClick={() => setNoteOpen((v) => !v)}
            title="Заметка"
            className={`${chipClass} inline-flex items-center gap-1.5 ${
              state.note
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Заметка
          </button>

          <button
            type="button"
            onClick={() => onToggleExpand(row.key)}
            title={expanded ? "Свернуть строку" : "Раскрыть строку"}
            className={squareBtnClass}
          >
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {changed && (
            <button
              type="button"
              onClick={() => onRevert(row.key)}
              title="Вернуть значения, которые сейчас в коде"
              className={iconBtnClass}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Вернуть как в коде
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {EDIT_LOCALES.map(({ loc, label }) => (
          <label key={loc} className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              {label} ({loc})
            </span>
            <Cell {...props} loc={loc} issues={issues} compact={dense && !expanded} />
          </label>
        ))}
      </div>

      {noteOpen && (
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Заметка (видна только в админке)
          </span>
          <textarea
            rows={2}
            value={state.note}
            onChange={(e) => onNote(row.key, e.target.value)}
            placeholder="Например: уточнить формулировку у заказчика"
            className={`${fieldClass} field-sizing-content min-h-16 resize-y border-border`}
          />
        </label>
      )}
    </div>
  );
});

/**
 * One editable value.
 *
 * `compact` keeps the cell one line high (spreadsheet feel) until the caret
 * enters it or the row is expanded — otherwise a long Armenian sentence would
 * be invisible. The `data-i18n-*` attributes are how Enter finds the cell one
 * row down (see focusCell in translations-editor.tsx).
 */
function Cell({
  row,
  state,
  loc,
  issues,
  compact,
  padForMenu,
  onValue,
  onCellFocus,
  onCellKeyDown,
  onCopyFrom,
  onExpand,
}: RowProps & {
  loc: Locale;
  issues: ValidationIssue[];
  compact: boolean;
  padForMenu?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [menu, setMenu] = useState(false);
  const value = state.values[loc];
  const codeValue = row.code[loc];
  const edited = value !== codeValue;
  const localeIssues = issues.filter((i) => i.locale === loc);
  const oneLine = compact && !focused;

  return (
    <div className="relative">
      <textarea
        data-i18n-key={row.key}
        data-i18n-loc={loc}
        rows={oneLine ? 1 : 2}
        wrap={oneLine ? "off" : "soft"}
        value={value}
        onChange={(e) => onValue(row.key, loc, e.target.value)}
        onFocus={(e) => {
          setFocused(true);
          onCellFocus(row.key, loc, e.currentTarget.value);
        }}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => onCellKeyDown(e, row.key, loc)}
        onDoubleClick={() => onExpand(row.key)}
        title={edited ? `В коде: ${codeValue}` : undefined}
        className={`${fieldClass} ${padForMenu ? "pr-7" : ""} ${
          oneLine ? "h-9 resize-none overflow-hidden py-1.5" : "field-sizing-content min-h-16 resize-y"
        } ${
          localeIssues.length > 0
            ? "border-danger/60"
            : edited
              ? "border-primary/60"
              : "border-border"
        }`}
      />

      <button
        type="button"
        // Out of the tab order: Tab must walk from cell to cell, as in a sheet.
        tabIndex={-1}
        onClick={() => setMenu((v) => !v)}
        title="Скопировать текст из другого языка"
        aria-label="Скопировать из другого языка"
        className="absolute right-1 top-1 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded text-muted-foreground opacity-40 transition-opacity hover:bg-muted hover:opacity-100"
      >
        <ArrowLeftRight className="h-3 w-3" />
      </button>
      {menu && (
        <div className="absolute right-0 top-7 z-30 min-w-40 rounded-lg border border-border bg-card p-1 shadow-lg">
          {LOCALES.filter((l) => l !== loc).map((from) => (
            <button
              key={from}
              type="button"
              onClick={() => {
                onCopyFrom(row.key, from, loc);
                setMenu(false);
              }}
              className="block w-full cursor-pointer rounded px-2 py-1.5 text-left text-xs text-foreground hover:bg-muted"
            >
              Скопировать из {LOCALE_SHORT[from]}
            </button>
          ))}
        </div>
      )}

      {localeIssues.map((issue, i) => (
        <span key={i} className="mt-1 block text-xs text-danger">
          {issue.message}
        </span>
      ))}
    </div>
  );
}

/** Colour switcher: three circles, clicking the active one clears the mark. */
function MarkPicker({
  rowKey,
  mark,
  onMark,
}: {
  rowKey: string;
  mark: Mark;
  onMark: (key: string, mark: Colour) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {MARK_LIST.map((m) => {
        const active = mark === m;
        return (
          <button
            key={m}
            type="button"
            aria-pressed={active}
            onClick={() => onMark(rowKey, m)}
            title={`${MARK_META[m].emoji} ${MARK_META[m].hint}${active ? " — нажмите ещё раз, чтобы снять метку" : ""}`}
            className={`h-4 w-4 cursor-pointer rounded-full border transition-all ${MARK_META[m].dot} ${
              active
                ? "scale-110 border-foreground/50 ring-2 ring-foreground/20"
                : "border-transparent opacity-35 hover:opacity-80"
            }`}
          />
        );
      })}
    </div>
  );
}

/** Per-row save/publish state badge. `compact` = icon only (table view). */
function Marker({
  state,
  awaitingBuild,
  compact,
}: {
  state: RowState;
  awaitingBuild: boolean;
  compact?: boolean;
}) {
  if (state.save === "error") {
    const text = state.error ?? "Ошибка сохранения";
    return (
      <span className="text-xs text-danger" title={text}>
        {compact ? "не сохранено" : text}
      </span>
    );
  }
  if (state.save === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {!compact && "сохраняю…"}
      </span>
    );
  }
  if (awaitingBuild) {
    return (
      <span className="text-xs text-warn" title="опубликовано, ждёт сборки">
        {compact ? "ждёт сборки" : "опубликовано, ждёт сборки"}
      </span>
    );
  }
  if (state.save === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-success">
        <Check className="h-3.5 w-3.5" />
        {!compact && "сохранено"}
      </span>
    );
  }
  return null;
}

/** Collapsible section header with its counters. Rendered either as a table row
 *  spanning every column or as a card-list heading. */
export function GroupHeader({
  context,
  rows,
  states,
  changedKeys,
  collapsed,
  onToggle,
  asTableRow,
}: {
  context: string;
  rows: TranslationRow[];
  states: Record<string, RowState>;
  changedKeys: Set<string>;
  collapsed: boolean;
  onToggle: (context: string) => void;
  asTableRow?: boolean;
}) {
  const stats = useMemo(() => {
    let changed = 0;
    const marks: Record<Mark, number> = { NONE: 0, GREEN: 0, RED: 0, BLUE: 0 };
    for (const r of rows) {
      if (changedKeys.has(r.key)) changed++;
      const st = states[r.key];
      if (st) marks[st.mark]++;
    }
    const parts = [`всего ${rows.length}`];
    if (changed > 0) parts.push(`изменено ${changed}`);
    for (const m of MARK_LIST) if (marks[m] > 0) parts.push(`${MARK_META[m].emoji} ${marks[m]}`);
    return parts.join(" · ");
  }, [rows, states, changedKeys]);

  const button = (
    <button
      type="button"
      onClick={() => onToggle(context)}
      className="inline-flex cursor-pointer items-center gap-2 text-left text-xs font-semibold text-foreground"
    >
      {collapsed ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      {context}
      <span className="font-normal text-muted-foreground">{stats}</span>
    </button>
  );

  if (!asTableRow) {
    return <div className="rounded-lg border border-border bg-muted px-3 py-2">{button}</div>;
  }
  return (
    <tr>
      <td colSpan={TABLE_COLS} className="border-b border-border bg-muted px-3 py-2">
        {/* Sticky so the section name stays readable while scrolling sideways. */}
        <span className="sticky left-3 inline-block">{button}</span>
      </td>
    </tr>
  );
}
