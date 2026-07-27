// Armenian (Mesropian) -> Latin transliteration, purely so a cast/crew name
// search box can match "raf" against "Ռաֆայել Թադևոսյան" (#Ф3 person picker).
// No deps, no I/O — kept pure so it's trivially unit-testable.

const LETTER_MAP: Record<string, string> = {
  ա: "a", բ: "b", գ: "g", դ: "d", ե: "e", զ: "z", է: "e", ը: "e", թ: "t",
  ժ: "zh", ի: "i", լ: "l", խ: "kh", ծ: "ts", կ: "k", հ: "h", ձ: "dz", ղ: "gh",
  ճ: "ch", մ: "m", յ: "y", ն: "n", շ: "sh", ո: "o", չ: "ch", պ: "p", ջ: "j",
  ռ: "r", ս: "s", վ: "v", տ: "t", ր: "r", ց: "ts", ւ: "v", փ: "p", ք: "k",
  օ: "o", ֆ: "f", և: "ev",
};

/** Lowercase + map every Armenian letter to its Latin equivalent; anything not
 *  in the map (Latin letters, digits, punctuation) passes through lowercased. */
export function romanizeArmenian(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => LETTER_MAP[ch] ?? ch)
    .join("");
}

/** True if `query` (case-insensitive) is a substring of `name` OR of its
 *  Armenian->Latin romanization — so "raf" matches "Ռաֆայել Թադևոսյան".
 *  An empty query matches everything (browsing state, nothing typed yet). */
export function matchesNameQuery(name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return name.toLowerCase().includes(q) || romanizeArmenian(name).includes(q);
}

/** Same test across every spelling a person carries (hy/ru/en + the legacy
 *  base) — searching the directory for "Арам" must find them even while the
 *  editor is showing the Armenian column. */
export function matchesAnyNameQuery(names: string[], query: string): boolean {
  if (!query.trim()) return true;
  return names.some((n) => matchesNameQuery(n, query));
}
