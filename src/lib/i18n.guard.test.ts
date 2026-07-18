import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { UI, LOCALES } from "./i18n";

describe("i18n dictionary — completeness", () => {
  it("every key has a non-empty string for ru / en / hy", () => {
    const missing: string[] = [];
    for (const [key, dict] of Object.entries(UI)) {
      for (const loc of LOCALES) {
        const v = (dict as Record<string, unknown>)[loc];
        if (typeof v !== "string" || v.trim() === "") missing.push(`${key}.${loc}`);
      }
    }
    expect(missing, `missing/empty translations:\n${missing.join("\n")}`).toEqual([]);
  });
});

describe("i18n dictionary — no Cyrillic homoglyphs in Armenian (F21 guard)", () => {
  // hy strings must be Armenian (+ Latin brand names / punctuation / digits),
  // never Cyrillic — a Cyrillic letter inside an hy value is a copy-paste
  // homoglyph bug that renders as a subtly-wrong character.
  const CYRILLIC = /[Ѐ-ӿ]/;

  it("no hy value contains a Cyrillic character", () => {
    const offenders: string[] = [];
    for (const [key, dict] of Object.entries(UI)) {
      const hy = (dict as Record<string, string>).hy ?? "";
      const hit = hy.match(CYRILLIC);
      if (hit) offenders.push(`${key}: "${hy}" (found «${hit[0]}» U+${hit[0].charCodeAt(0).toString(16).toUpperCase()})`);
    }
    expect(offenders, `Cyrillic homoglyphs in hy:\n${offenders.join("\n")}`).toEqual([]);
  });
});

describe("i18n dictionary — no duplicate keys in source", () => {
  it("each dictionary key appears exactly once in i18n.ts", () => {
    const src = readFileSync(fileURLToPath(new URL("./i18n.ts", import.meta.url)), "utf8");
    // Match top-level dictionary entries: `  "some.key": { ru: ...`
    const re = /^\s{2}"([^"]+)":\s*\{\s*ru:/gm;
    const seen = new Map<string, number>();
    for (let m = re.exec(src); m; m = re.exec(src)) {
      seen.set(m[1], (seen.get(m[1]) ?? 0) + 1);
    }
    const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([k, n]) => `${k} ×${n}`);
    expect(dupes, `duplicate keys:\n${dupes.join("\n")}`).toEqual([]);
  });
});
