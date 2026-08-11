/* QA-9: the catalog's result count used a plain singular/plural switch
 * (n === 1 ? singular : plural) for both halves of "Показано N проектов · M
 * рекламных мест" — which happens to look right at n=1 and n=5+ but prints
 * "2 рекламных мест" instead of "2 рекламных места", because Russian has
 * three cardinal forms, not two. `Intl.PluralRules` already knows the CLDR
 * rule per locale (native, no data file to maintain) — this just collapses
 * its result to the three dictionary keys ru actually needs; en/hy only ever
 * produce two of them (see the .test.ts), and the count.<hy> string is
 * identical across all three anyway. */

const CACHE = new Map<string, Intl.PluralRules>();

function rules(locale: "hy" | "ru" | "en"): Intl.PluralRules {
  let r = CACHE.get(locale);
  if (!r) {
    r = new Intl.PluralRules(locale);
    CACHE.set(locale, r);
  }
  return r;
}

/** The three dictionary suffixes a `<key>.<form>` count string declares. */
export type PluralForm = "one" | "few" | "many";

/** CLDR "few" is Russian-only among our locales; everything else CLDR calls
 *  "many" or "other" collapses to "many" here. */
export function pluralForm(locale: "hy" | "ru" | "en", n: number): PluralForm {
  const category = rules(locale).select(n);
  return category === "one" || category === "few" ? category : "many";
}

/** Key for "{free} из {total} размещений свободно" — the noun agrees with
 *  `total`, so a project with 21 placements read "21 размещений". Shared by
 *  the report's sticky offer bar and its deal card, which render the same
 *  sentence from different files. */
export function slotsLabelKey(
  locale: "hy" | "ru" | "en",
  total: number,
): "report.offerBarSlots" | "report.offerBarSlotsFew" | "report.offerBarSlotsOne" {
  const form = pluralForm(locale, total);
  if (form === "one") return "report.offerBarSlotsOne";
  if (form === "few") return "report.offerBarSlotsFew";
  return "report.offerBarSlots";
}
