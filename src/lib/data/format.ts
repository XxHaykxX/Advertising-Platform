import { intlLocale, type Locale } from "@/lib/i18n";

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

/** IA-2: view/metric counts (e.g. ProjectDetailDTO.projViews) are stored as
 * admin-entered strings that may already be compact ("420K", "1.2M") or plain
 * ("5000"). English keeps the compact abbreviation; hy/ru don't use "K"/"M"
 * so they always render the fully grouped number ("420 000"). Also handles
 * ranges ("5K – 10K") by reformatting every number token in the string, and
 * leaves anything with no recognizable number untouched. */
export function formatCompactNumber(value: string | number, locale: Locale): string {
  if (typeof value === "number") return formatNumberToken(value, locale);
  if (!value) return value;
  let matched = false;
  // Only tokens with a K/M suffix get reformatted ("420K", "1.2M"). A
  // suffix-less number is left exactly as typed — it may already be grouped
  // ("500 000" / "500,000"), and blindly re-parsing it as a float would
  // mangle the grouping (e.g. "500 000" -> "5000").
  const result = value.replace(/(\d+(?:\.\d+)?)\s*([kKmM])/g, (full, numPart: string, suffix: string) => {
    const raw = parseFloat(numPart);
    if (Number.isNaN(raw)) return full;
    matched = true;
    const upperSuffix = suffix.toUpperCase();
    const multiplier = upperSuffix === "M" ? 1_000_000 : 1_000;
    return formatNumberToken(raw * multiplier, locale);
  });
  return matched ? result : value;
}

function formatNumberToken(num: number, locale: Locale): string {
  if (locale === "en") {
    return new Intl.NumberFormat(intlLocale(locale), { notation: "compact", maximumFractionDigits: 1 }).format(num);
  }
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 0 }).format(num);
}
