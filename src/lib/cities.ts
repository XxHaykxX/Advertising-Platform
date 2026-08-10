/* QA-8: AdSpace.city is free text (a plain <input>, never converted to a
 * closed picker the way Country/StreamingSource were on 2026-07-27) — a
 * creator types it in whatever script they're using, so the DB holds
 * "Երևան" verbatim and every locale printed it verbatim too.
 *
 * Rather than turn city into a closed field (a data-model change, owner's
 * call — see the QA-8 report), this covers Armenia's well-known towns by
 * name, same shape as src/lib/countries.ts: ALIASES resolves any spelling a
 * creator is likely to type (hy/ru/en) to one canonical English key, and an
 * unrecognised value — a village, a typo, a foreign city — passes through
 * unchanged rather than rendering blank or "undefined". Pure data, no
 * imports, safe to import from both server (ad-spaces.ts) and client
 * (catalog-view.tsx's City facet) code. */

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

/** One city token in the reader's language; unknown tokens pass through
 *  unchanged so a hand-typed value (a village, a typo) still renders. */
export function localizeCity(locale: "hy" | "ru" | "en", token: string): string {
  const key = ALIASES[token] ?? token;
  if (locale === "en") return key;
  const entry = CITY_LABELS[key];
  if (!entry) return token;
  return locale === "ru" ? entry.ru : entry.hy;
}
