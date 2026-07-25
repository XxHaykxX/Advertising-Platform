import { describe, it, expect } from "vitest";
import { DictionaryDriftError, renderEntry, rewriteDictionarySource } from "./i18n-rewrite";
import type { Values } from "./i18n-rewrite";

/* A miniature stand-in for src/lib/i18n.ts: one single-line entry, one
   multi-line entry, a section comment and a trailing key — enough to prove the
   rewriter only touches what it must. */
const SOURCE = [
  "export const UI: Record<string, Dict> = {",
  "  // ── header nav ──",
  '  "nav.catalog": { ru: "Каталог", en: "Catalog", hy: "Կատալոգ" },',
  '  "hero.body": {',
  '    ru: "Длинный текст",',
  '    en: "Long body",',
  '    hy: "Երկար տեքստ",',
  "  },",
  '  "ui.count": { ru: "Всего {n}", en: "Total {n}", hy: "Ընդամենը {n}" },',
  "};",
].join("\n");

const CURRENT: Record<string, Values> = {
  "nav.catalog": { ru: "Каталог", en: "Catalog", hy: "Կատալոգ" },
  "hero.body": { ru: "Длинный текст", en: "Long body", hy: "Երկար տեքստ" },
  "ui.count": { ru: "Всего {n}", en: "Total {n}", hy: "Ընդամենը {n}" },
};

describe("renderEntry", () => {
  it("keeps short entries on one line with ru first (guard-test anchor)", () => {
    const line = renderEntry("nav.x", { ru: "Р", en: "E", hy: "Հ" });
    expect(line).toBe('  "nav.x": { ru: "Р", en: "E", hy: "Հ" },');
  });

  it("switches to the multi-line form when the single line would exceed 120 cols", () => {
    const long = "x".repeat(60);
    expect(renderEntry("some.key", { ru: long, en: long, hy: long }).split("\n")).toHaveLength(5);
  });

  it("escapes quotes, backslashes and newlines into valid TS literals", () => {
    const rendered = renderEntry("k", { ru: 'кавычка " и \\ слеш', en: "line\nbreak", hy: "Հ" });
    expect(rendered).toContain('\\"');
    expect(rendered).toContain("\\\\");
    // A raw newline inside a value must never reach the file body.
    expect(rendered.split("\n").filter((l) => l.includes("line"))[0]).toContain("\\n");
  });
});

describe("rewriteDictionarySource", () => {
  it("replaces only the changed entry and leaves the rest byte-identical", () => {
    const updates = new Map<string, Values>([
      ["nav.catalog", { ru: "Каталог", en: "Browse", hy: "Կատալոգ" }],
    ]);
    const { source, changed, perLocale } = rewriteDictionarySource(SOURCE, updates, CURRENT);

    expect(changed).toEqual(["nav.catalog"]);
    expect(perLocale).toEqual({ ru: 0, en: 1, hy: 0 });
    expect(source).toContain('"nav.catalog": { ru: "Каталог", en: "Browse", hy: "Կատալոգ" },');
    // Untouched neighbours + the section comment survive.
    expect(source).toContain("  // ── header nav ──");
    expect(source).toContain('    ru: "Длинный текст",');
    expect(source.split("\n")).toHaveLength(SOURCE.split("\n").length);
  });

  it("replaces a multi-line entry as a whole", () => {
    const updates = new Map<string, Values>([
      ["hero.body", { ru: "Коротко", en: "Short", hy: "Կարճ" }],
    ]);
    const { source } = rewriteDictionarySource(SOURCE, updates, CURRENT);
    expect(source).toContain('"hero.body": { ru: "Коротко", en: "Short", hy: "Կարճ" },');
    expect(source).not.toContain('ru: "Длинный текст"');
    // The entry after it must still be there (no over-splicing).
    expect(source).toContain('"ui.count":');
  });

  it("is a no-op when values already match the committed dictionary", () => {
    const updates = new Map<string, Values>([["nav.catalog", { ...CURRENT["nav.catalog"] }]]);
    const { source, changed } = rewriteDictionarySource(SOURCE, updates, CURRENT);
    expect(changed).toEqual([]);
    expect(source).toBe(SOURCE);
  });

  it("throws on a key that is not in the dictionary", () => {
    const updates = new Map<string, Values>([["nope.key", { ru: "a", en: "b", hy: "c" }]]);
    expect(() => rewriteDictionarySource(SOURCE, updates, CURRENT)).toThrow(/unknown dictionary key/);
  });

  it("throws DictionaryDriftError when the file holds other values than `current`", () => {
    // Someone else published "Browse" already; this build still thinks the
    // committed value is "Catalog".
    const ahead = SOURCE.replace('en: "Catalog"', 'en: "Browse"');
    const updates = new Map<string, Values>([
      ["nav.catalog", { ru: "Каталог", en: "Каталог-EN", hy: "Կատալոգ" }],
    ]);
    expect(() => rewriteDictionarySource(ahead, updates, CURRENT)).toThrow(DictionaryDriftError);
    // …and the stale value is not written.
    expect(ahead).toContain('en: "Browse"');
  });

  it("throws DictionaryDriftError when the entry isn't a plain ru/en/hy triple", () => {
    const odd = SOURCE.replace(
      '  "nav.catalog": { ru: "Каталог", en: "Catalog", hy: "Կատալոգ" },',
      '  "nav.catalog": { ...base, ru: "Каталог" },',
    );
    const updates = new Map<string, Values>([
      ["nav.catalog", { ru: "Каталог", en: "Browse", hy: "Կատալոգ" }],
    ]);
    expect(() => rewriteDictionarySource(odd, updates, CURRENT)).toThrow(DictionaryDriftError);
  });

  it("throws when the source drifted and the entry line is gone", () => {
    const drifted = SOURCE.replace('  "nav.catalog": {', '  "nav.renamed": {');
    const updates = new Map<string, Values>([
      ["nav.catalog", { ru: "Каталог", en: "Browse", hy: "Կատալոգ" }],
    ]);
    expect(() => rewriteDictionarySource(drifted, updates, CURRENT)).toThrow(/not found/);
  });
});
