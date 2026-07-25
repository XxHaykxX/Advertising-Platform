import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/i18n-csv";
import { buildCsv, planImport, TRANSFER_HEADER, type TransferRow } from "./csv-io";

/* The CSV round-trip of /admin/i18n: what the editor writes out, and what it
   makes of a file Excel has re-saved (renamed/reordered columns, blank cells,
   unknown keys). */

function row(key: string, hy: string, ru: string, en: string, extra: Partial<TransferRow> = {}) {
  return {
    key,
    context: "Шапка (меню)",
    values: { hy, ru, en },
    mark: "NONE" as const,
    note: "",
    ...extra,
  } satisfies TransferRow;
}

const CURRENT = new Map<string, TransferRow>([
  ["nav.catalog", row("nav.catalog", "Կատալոգ", "Каталог", "Catalog")],
  ["nav.about", row("nav.about", "Մեր մասին", "О нас", "About", { mark: "RED", note: "спросить" })],
]);

/** Header + rows as a CRLF file, the way Excel saves it. */
function file(rows: string[][]): string {
  return rows.map((r) => r.join(",")).join("\r\n");
}

describe("buildCsv", () => {
  it("writes the header, a BOM and CRLF rows", () => {
    const text = buildCsv([...CURRENT.values()]);
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text.split("\r\n")[0]).toBe(`﻿${TRANSFER_HEADER.join(",")}`);
    expect(text.endsWith("\r\n")).toBe(true);
  });

  it("round-trips through parseCsv with mark and note", () => {
    const rows = parseCsv(buildCsv([...CURRENT.values()]));
    expect(rows[0]).toEqual([...TRANSFER_HEADER]);
    expect(rows[2]).toEqual([
      "nav.about",
      "Шапка (меню)",
      "Մեր մասին",
      "О нас",
      "About",
      "RED",
      "спросить",
    ]);
  });

  it("quotes values with commas so the file stays parseable", () => {
    const text = buildCsv([row("nav.catalog", "ա, բ", 'с "кавычками"', "a, b")]);
    expect(parseCsv(text)[1][2]).toBe("ա, բ");
    expect(parseCsv(text)[1][3]).toBe('с "кавычками"');
  });
});

describe("planImport", () => {
  it("finds columns by name, not by position", () => {
    const res = planImport(
      file([
        ["Комментарий Мариам", "ru", "key", "en", "hy"],
        ["любой текст", "Каталог сайта", "nav.catalog", "Catalog", "Կատալոգ"],
      ]),
      CURRENT,
    );
    expect("plan" in res && res.plan.changes).toEqual([
      {
        key: "nav.catalog",
        values: { hy: "Կատալոգ", ru: "Каталог сайта", en: "Catalog" },
        mark: "NONE",
        note: "",
        diffs: [{ field: "ru", before: "Каталог", after: "Каталог сайта" }],
      },
    ]);
  });

  it("counts changed values per locale and leaves matching rows alone", () => {
    const res = planImport(
      file([
        ["key", "hy", "ru", "en"],
        ["nav.catalog", "Նոր", "Новый", "Catalog"],
        ["nav.about", "Մեր մասին", "О нас", "About"],
      ]),
      CURRENT,
    );
    if (!("plan" in res)) throw new Error(res.error);
    expect(res.plan.counts).toEqual({ hy: 1, ru: 1, en: 0, mark: 0, note: 0 });
    expect(res.plan.unchanged).toBe(1);
    expect(res.plan.changes).toHaveLength(1);
  });

  it("never empties a value from a blank cell", () => {
    const res = planImport(
      file([
        ["key", "hy", "ru", "en"],
        ["nav.catalog", "", "", ""],
      ]),
      CURRENT,
    );
    if (!("plan" in res)) throw new Error(res.error);
    expect(res.plan.changes).toEqual([]);
    expect(res.plan.unchanged).toBe(1);
  });

  it("reports unknown keys instead of applying them", () => {
    const res = planImport(
      file([
        ["key", "ru"],
        ["nav.gone", "Пропало"],
        ["nav.catalog", "Каталог"],
      ]),
      CURRENT,
    );
    if (!("plan" in res)) throw new Error(res.error);
    expect(res.plan.unknownKeys).toEqual(["nav.gone"]);
    expect(res.plan.changes).toEqual([]);
  });

  it("reads marks by name and by emoji, and clears one on a blank cell", () => {
    const res = planImport(
      file([
        ["key", "mark", "note"],
        ["nav.catalog", "🟢", ""],
        ["nav.about", "", ""],
      ]),
      CURRENT,
    );
    if (!("plan" in res)) throw new Error(res.error);
    expect(res.plan.changes.map((c) => [c.key, c.mark, c.note])).toEqual([
      ["nav.catalog", "GREEN", ""],
      ["nav.about", "NONE", ""],
    ]);
    expect(res.plan.counts.mark).toBe(2);
    expect(res.plan.counts.note).toBe(1); // nav.about had "спросить"
  });

  it("keeps the existing mark when the cell holds something unexpected", () => {
    const res = planImport(
      file([
        ["key", "mark"],
        ["nav.about", "жёлтый?"],
      ]),
      CURRENT,
    );
    if (!("plan" in res)) throw new Error(res.error);
    expect(res.plan.changes).toEqual([]);
  });

  it("rejects a file without a key column", () => {
    const res = planImport(file([["hy", "ru", "en"], ["Կատալոգ", "Каталог", "Catalog"]]), CURRENT);
    expect("error" in res && res.error).toContain("key");
  });

  it("rejects a file without any translation column", () => {
    const res = planImport(file([["key", "Где на сайте"], ["nav.catalog", "Шапка"]]), CURRENT);
    expect("error" in res && res.error).toContain("hy");
  });

  it("takes the last row when a key is duplicated", () => {
    const res = planImport(
      file([
        ["key", "ru"],
        ["nav.catalog", "Первый"],
        ["nav.catalog", "Второй"],
      ]),
      CURRENT,
    );
    if (!("plan" in res)) throw new Error(res.error);
    expect(res.plan.changes).toHaveLength(1);
    expect(res.plan.changes[0].values.ru).toBe("Второй");
  });

  it("reads a multi-line cell Excel saved with CRLF as a plain line break", () => {
    const withBreak = new Map<string, TransferRow>([
      ["nav.catalog", row("nav.catalog", "Կատալոգ", "Первая\nвторая", "Catalog")],
    ]);
    const res = planImport('key,ru\r\nnav.catalog,"Первая\r\nвторая"\r\n', withBreak);
    if (!("plan" in res)) throw new Error(res.error);
    expect(res.plan.changes).toEqual([]);
    expect(res.plan.unchanged).toBe(1);
  });

  it("survives the editor's own export unchanged", () => {
    const res = planImport(buildCsv([...CURRENT.values()]), CURRENT);
    if (!("plan" in res)) throw new Error(res.error);
    expect(res.plan.changes).toEqual([]);
    expect(res.plan.unchanged).toBe(2);
    expect(res.plan.unknownKeys).toEqual([]);
  });
});
