/* CSV round-trip of the editor's current state: "выгрузил → поправил в Excel →
   загрузил". Pure functions (no DOM, no DB) so the tricky part — matching a
   file Excel has re-saved against the 855 keys of this build — is unit-tested
   in csv-transfer.test.ts; the buttons and the preview dialog live in
   csv-transfer.tsx.

   Columns are recognized by *name*, never by position: Excel and Sheets happily
   insert helper columns, and Мариам shouldn't have to keep them in order. */

import { CSV_HEADER, csvLine, parseCsv } from "@/lib/i18n-csv";
import { LOCALES, type Locale } from "@/lib/i18n";
import type { Values } from "@/lib/i18n-validate";
import { parseMarkCell, type Mark } from "./mark";

/** The public feed's columns + the translator's own two. */
export const TRANSFER_HEADER = [...CSV_HEADER, "mark", "note"] as const;

/** One dictionary row as the file sees it. */
export type TransferRow = {
  key: string;
  context: string;
  values: Values;
  mark: Mark;
  note: string;
};

/** Field of a row the file wants to change, with both sides for the preview. */
export type CellDiff = {
  field: Locale | "mark" | "note";
  before: string;
  after: string;
};

/** One row the file changes: the resulting values plus what moved. */
export type ImportChange = {
  key: string;
  values: Values;
  mark: Mark;
  note: string;
  diffs: CellDiff[];
};

export type ImportPlan = {
  changes: ImportChange[];
  /** Rows whose key is not in this build's dictionary — reported, never applied. */
  unknownKeys: string[];
  /** Recognized rows that match the editor already. */
  unchanged: number;
  /** How many values each column changes (drives the preview summary). */
  counts: Record<Locale | "mark" | "note", number>;
};

export type ImportResult = { plan: ImportPlan } | { error: string };

/** Column aliases, so a file re-saved with translated headers still imports. */
const COLUMNS: Record<"key" | Locale | "mark" | "note", string[]> = {
  key: ["key", "ключ"],
  hy: ["hy", "армянский", "hy (армянский)"],
  ru: ["ru", "русский", "ru (русский)"],
  en: ["en", "english", "en (english)", "английский"],
  mark: ["mark", "метка"],
  note: ["note", "заметка"],
};

function columnIndex(header: string[], names: string[]): number {
  return header.findIndex((h) => names.includes(h));
}

/** Excel keeps a multi-line cell as CRLF; the dictionary uses LF. Without this
 *  a value merely re-saved by Excel would read as changed, and a stray \r would
 *  travel into src/lib/i18n.ts. */
function normalizeCell(v: string): string {
  return v.includes("\r") ? v.replace(/\r\n?/g, "\n") : v;
}

/** Build the download: same shape as the public feed (UTF-8 BOM + CRLF) with
 *  `mark` and `note` appended, so a re-upload round-trips the review state. */
export function buildCsv(rows: TransferRow[]): string {
  const lines = [csvLine([...TRANSFER_HEADER])];
  for (const r of rows) {
    lines.push(
      csvLine([
        r.key,
        r.context,
        r.values.hy,
        r.values.ru,
        r.values.en,
        r.mark === "NONE" ? "" : r.mark,
        r.note,
      ]),
    );
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/**
 * Compare an uploaded file with the editor's current rows.
 *
 * Deliberately conservative: a blank locale cell means "not filled in", not
 * "erase the text" — a partially filled export must never empty the
 * dictionary. Unknown keys are collected for the report; the key set belongs to
 * the code.
 */
export function planImport(text: string, current: Map<string, TransferRow>): ImportResult {
  const rows = parseCsv(text);
  if (rows.length === 0) return { error: "Файл пустой" };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const keyAt = columnIndex(header, COLUMNS.key);
  if (keyAt < 0) {
    return { error: "В файле нет колонки «key» — сохраните его вместе со строкой заголовков" };
  }
  const localeAt = { hy: -1, ru: -1, en: -1 } as Record<Locale, number>;
  for (const loc of LOCALES) localeAt[loc] = columnIndex(header, COLUMNS[loc]);
  const markAt = columnIndex(header, COLUMNS.mark);
  const noteAt = columnIndex(header, COLUMNS.note);
  // A mark/note-only file is a legitimate review pass, so any known data
  // column will do — this only rejects a file that isn't a dictionary export.
  if (LOCALES.every((loc) => localeAt[loc] < 0) && markAt < 0 && noteAt < 0) {
    return { error: "В файле нет колонок, которые можно загрузить: hy, ru, en, mark или note" };
  }

  const byKey = new Map<string, ImportChange>();
  const unknown = new Set<string>();
  let unchanged = 0;
  const counts: Record<Locale | "mark" | "note", number> = {
    hy: 0,
    ru: 0,
    en: 0,
    mark: 0,
    note: 0,
  };

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    const key = (cells[keyAt] ?? "").trim();
    if (key === "") continue;
    const row = current.get(key);
    if (!row) {
      unknown.add(key);
      continue;
    }

    // A duplicated key (Excel copy-paste) is folded into the previous decision:
    // the last row of the file wins, so start from what we already planned.
    const planned = byKey.get(key);
    const base: TransferRow = planned
      ? { ...row, values: planned.values, mark: planned.mark, note: planned.note }
      : row;

    const values: Values = { ...base.values };
    const diffs: CellDiff[] = [];
    for (const loc of LOCALES) {
      const at = localeAt[loc];
      if (at < 0) continue;
      const next = normalizeCell(cells[at] ?? "");
      if (next.trim() === "" || next === row.values[loc]) continue;
      values[loc] = next;
      diffs.push({ field: loc, before: row.values[loc], after: next });
    }

    let mark = base.mark;
    if (markAt >= 0) {
      const next = parseMarkCell(cells[markAt] ?? "", row.mark);
      if (next !== row.mark) {
        mark = next;
        diffs.push({ field: "mark", before: row.mark, after: next });
      }
    }

    let note = base.note;
    if (noteAt >= 0) {
      const next = normalizeCell(cells[noteAt] ?? "").trim();
      if (next !== row.note) {
        note = next;
        diffs.push({ field: "note", before: row.note, after: next });
      }
    }

    if (diffs.length === 0) {
      if (!planned) unchanged++;
      continue;
    }
    if (planned) byKey.delete(key);
    byKey.set(key, { key, values, mark, note, diffs });
  }

  for (const change of byKey.values()) {
    for (const d of change.diffs) counts[d.field]++;
  }

  return {
    plan: { changes: [...byKey.values()], unknownKeys: [...unknown], unchanged, counts },
  };
}

/** Short "было → станет" line for the preview list. */
export function diffLabel(d: CellDiff): string {
  const cut = (s: string) => (s.length > 60 ? `${s.slice(0, 60)}…` : s) || "—";
  return `${d.field}: ${cut(d.before)} → ${cut(d.after)}`;
}
