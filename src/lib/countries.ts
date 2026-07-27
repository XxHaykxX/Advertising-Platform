/* Countries a title can originate from — the closed list behind the project
 * form's "Content Original Countries" multi-select (2026-07-27).
 *
 * It used to be a free-text field: every editor typed their own spelling
 * ("US" / "USA" / "United States"), which the catalog then treated as three
 * different countries and the translation table couldn't localize. The list is
 * the source of truth for both the picker and the hy/ru labels.
 *
 * Values are stored in English, comma-separated, exactly as before — a project
 * that already carries a country outside this list keeps it (the multi-select
 * renders stored values as chips regardless), it just can't be picked again.
 *
 * Pure data, no imports — used by the client form and by the server data layer. */

/** English → the other two locales. Key order is the order shown in the picker:
 *  the countries an Armenian production actually co-produces with first, the
 *  rest alphabetical. */
export const COUNTRY_LABELS: Record<string, { ru: string; hy: string }> = {
  Armenia: { ru: "Армения", hy: "Հայաստան" },
  Russia: { ru: "Россия", hy: "Ռուսաստան" },
  Georgia: { ru: "Грузия", hy: "Վրաստան" },
  USA: { ru: "США", hy: "ԱՄՆ" },
  France: { ru: "Франция", hy: "Ֆրանսիա" },
  Germany: { ru: "Германия", hy: "Գերմանիա" },
  Italy: { ru: "Италия", hy: "Իտալիա" },
  "United Kingdom": { ru: "Великобритания", hy: "Մեծ Բրիտանիա" },
  Spain: { ru: "Испания", hy: "Իսպանիա" },
  Poland: { ru: "Польша", hy: "Լեհաստան" },
  Ukraine: { ru: "Украина", hy: "Ուկրաինա" },
  Kazakhstan: { ru: "Казахстан", hy: "Ղազախստան" },
  Turkey: { ru: "Турция", hy: "Թուրքիա" },
  Iran: { ru: "Иран", hy: "Իրան" },
  Lebanon: { ru: "Ливан", hy: "Լիբանան" },
  "United Arab Emirates": { ru: "ОАЭ", hy: "ԱՄԷ" },
  Canada: { ru: "Канада", hy: "Կանադա" },
  Netherlands: { ru: "Нидерланды", hy: "Նիդերլանդներ" },
  Belgium: { ru: "Бельгия", hy: "Բելգիա" },
  "Czech Republic": { ru: "Чехия", hy: "Չեխիա" },
  Greece: { ru: "Греция", hy: "Հունաստան" },
  India: { ru: "Индия", hy: "Հնդկաստան" },
  China: { ru: "Китай", hy: "Չինաստան" },
  Japan: { ru: "Япония", hy: "Ճապոնիա" },
  "South Korea": { ru: "Южная Корея", hy: "Հարավային Կորեա" },
  Argentina: { ru: "Аргентина", hy: "Արգենտինա" },
  Brazil: { ru: "Бразилия", hy: "Բրազիլիա" },
  Mexico: { ru: "Мексика", hy: "Մեքսիկա" },
  // Not a state, but how diaspora co-productions have always been credited on
  // this platform — kept because projects already carry it.
  Diaspora: { ru: "Диаспора", hy: "Սփյուռք" },
};

/** The picker's option list. */
export const COUNTRY_VALUES: string[] = Object.keys(COUNTRY_LABELS);

/** Legacy spellings that mean a listed country — the field was free text until
 *  2026-07-27, so stored data has both "US" and "USA". Used for display only;
 *  nothing rewrites the column. */
const ALIASES: Record<string, string> = {
  US: "USA",
  "United States": "USA",
  UK: "United Kingdom",
  Britain: "United Kingdom",
  UAE: "United Arab Emirates",
  Czechia: "Czech Republic",
  Korea: "South Korea",
};

/** One country token in the reader's language; unknown tokens pass through
 *  unchanged so a hand-typed legacy value still renders. */
export function localizeCountry(locale: "hy" | "ru" | "en", token: string): string {
  const key = ALIASES[token] ?? token;
  if (locale === "en") return key;
  const entry = COUNTRY_LABELS[key];
  if (!entry) return token;
  return locale === "ru" ? entry.ru : entry.hy;
}

/** "Armenia, France" -> "Армения, Франция". */
export function localizeCountryList(locale: "hy" | "ru" | "en", csv: string): string {
  if (!csv) return csv;
  return csv
    .split(",")
    .map((t) => localizeCountry(locale, t.trim()))
    .filter(Boolean)
    .join(", ");
}
