/* QA-8/#64: AdSpace.city used to be plain free text — a creator typed it in
 * whatever script they were using, so the DB held "Երևան" verbatim and every
 * locale printed it verbatim too. Owner decision (11.08): turn it into a
 * closed picker, same mechanic as Country/StreamingSource (2026-07-27) — the
 * DB-backed City dictionary (prisma/schema.prisma) is the picker's option
 * list and normalizeCityToken() is what the form's save path runs every value
 * through before it reaches AdSpace.city, so the column always holds one of
 * these canonical English keys from here on.
 *
 * `address` (street, building) is NOT part of this — it stays free text, by
 * design (see the comment on AdSpace.city/address): a street address doesn't
 * fit a closed list, only the city name does.
 *
 * ALIASES resolves any spelling already on file, or that a creator's custom
 * entry might use (hy/ru/en), to one canonical key; an unrecognised value — a
 * village, a typo, a foreign city — passes through unchanged rather than
 * rendering blank or "undefined", same contract as src/lib/countries.ts. Pure
 * data, no imports, safe to import from both server (ad-spaces.ts, write.ts)
 * and client (catalog-view.tsx's City facet, ad-space-form.tsx) code. */

const CITY_LABELS: Record<string, { ru: string; hy: string }> = {
  Yerevan: { ru: "Ереван", hy: "Երևան" },
  Gyumri: { ru: "Гюмри", hy: "Գյումրի" },
  Vanadzor: { ru: "Ванадзор", hy: "Վանաձոր" },
  Vagharshapat: { ru: "Вагаршапат", hy: "Վաղարշապատ" },
  Hrazdan: { ru: "Раздан", hy: "Հրազդան" },
  Abovyan: { ru: "Абовян", hy: "Աբովյան" },
  Kapan: { ru: "Капан", hy: "Կապան" },
  Armavir: { ru: "Армавир", hy: "Արմավիր" },
  Gavar: { ru: "Гавар", hy: "Գավառ" },
  Artashat: { ru: "Арташат", hy: "Արտաշատ" },
  Ijevan: { ru: "Иджеван", hy: "Իջևան" },
  Dilijan: { ru: "Дилижан", hy: "Դիլիջան" },
  Sevan: { ru: "Севан", hy: "Սևան" },
  Goris: { ru: "Горис", hy: "Գորիս" },
  Stepanavan: { ru: "Степанаван", hy: "Ստեփանավան" },
  Ashtarak: { ru: "Аштарак", hy: "Աշտարակ" },
  Charentsavan: { ru: "Чаренцаван", hy: "Չարենցավան" },
  Alaverdi: { ru: "Алаверди", hy: "Ալավերդի" },
  Spitak: { ru: "Спитак", hy: "Սպիտակ" },
  Ararat: { ru: "Арарат", hy: "Արարատ" },
};

/** Every spelling a creator could plausibly type — the hy/ru forms above, plus
 *  the common English alt-name — mapped to the canonical English key. */
const ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries(CITY_LABELS).flatMap(([key, { ru, hy }]) => [
    [ru, key],
    [hy, key],
  ]),
);
// Echmiadzin is Vagharshapat's pre-Soviet (and still commonly used) name.
ALIASES["Echmiadzin"] = "Vagharshapat";
ALIASES["Эчмиадзин"] = "Vagharshapat";
ALIASES["Էջմիածին"] = "Vagharshapat";

/** The picker's built-in option list, and the City table's seed (2026-08-11) —
 *  same relationship COUNTRY_VALUES has to Country. */
export const CITY_VALUES: string[] = Object.keys(CITY_LABELS);

/** Resolves any known spelling to the canonical English key; an unrecognised
 *  value passes through unchanged (a village, a typo — same fallback as
 *  localizeCity below). This is what the ad-space save path runs `city`
 *  through so the column only ever holds a canonical key or a value nothing
 *  here recognises, never a known city under an alternate spelling. */
export function canonicalCityToken(token: string): string {
  return ALIASES[token] ?? token;
}

/** One city token in the reader's language; unknown tokens pass through
 *  unchanged so a hand-typed value (a village, a typo) still renders. */
export function localizeCity(locale: "hy" | "ru" | "en", token: string): string {
  const key = canonicalCityToken(token);
  if (locale === "en") return key;
  const entry = CITY_LABELS[key];
  if (!entry) return token;
  return locale === "ru" ? entry.ru : entry.hy;
}
