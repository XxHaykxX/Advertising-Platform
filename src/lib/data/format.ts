export function parseStringArray(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function splitCountries(s: string): string[] {
  if (!s) return [];
  // Split on ", " but NOT inside parentheses, so values like
  // "Diaspora (US, France)" stay intact instead of splitting into
  // "Diaspora (US" + "France)".
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out.filter(Boolean);
}

// TODO(currency): route through formatMoney once estValue is real AMD.
// estValue/exposureTotal are still placeholder numbers on a different track
// (see currency feature spec) — left untouched for now.
export function moneyShort(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

export function sumExposure(opps: { estValue: number }[]): number {
  return opps.reduce((sum, o) => sum + o.estValue, 0);
}

/* Explicit month-name tables, keyed by the 2-letter app language. Deterministic
 * across server (Node ICU) and client (browser Intl) — avoids the hydration
 * mismatch that toLocaleDateString("hy-AM") caused when the server's ICU fell
 * back to a different locale than the browser. Nominative for month+year,
 * genitive for full dates (natural in ru/hy). */
const MONTHS_NOMINATIVE: Record<string, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ru: ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
  hy: ["հունվար", "փետրվար", "մարտ", "ապրիլ", "մայիս", "հունիս", "հուլիս", "օգոստոս", "սեպտեմբեր", "հոկտեմբեր", "նոյեմբեր", "դեկտեմբեր"],
};
const MONTHS_GENITIVE: Record<string, string[]> = {
  en: MONTHS_NOMINATIVE.en,
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  hy: ["հունվարի", "փետրվարի", "մարտի", "ապրիլի", "մայիսի", "հունիսի", "հուլիսի", "օգոստոսի", "սեպտեմբերի", "հոկտեմբերի", "նոյեմբերի", "դեկտեմբերի"],
};

/** Turn an Intl locale string ("en-US" / "ru-RU" / "hy-AM") into a table key. */
function langKey(locale: string): "en" | "ru" | "hy" {
  const p = locale.slice(0, 2);
  return p === "ru" || p === "hy" ? p : "en";
}

export function formatMonthYear(iso: string | null, locale = "en-US"): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const lang = langKey(locale);
  const month = MONTHS_NOMINATIVE[lang][d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return lang === "hy" ? `${year} թ. ${month}` : `${month} ${year}`;
}

export function formatFullDate(iso: string | null, locale = "en-US"): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const lang = langKey(locale);
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  const month = MONTHS_GENITIVE[lang][d.getUTCMonth()];
  if (lang === "en") return `${month} ${day}, ${year}`;
  return `${day} ${month} ${year}`;
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = d.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
