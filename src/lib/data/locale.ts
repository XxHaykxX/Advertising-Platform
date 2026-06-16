import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n";
import { getSettings } from "@/lib/data/settings";

/** Read and validate the site-wide default locale from the settings table.
 *  Wrapped in React cache() to deduplicate within a single render pass. */
const getDefaultLocale = cache(async (): Promise<Locale> => {
  const s = await getSettings();
  const v = s["default_lang"];
  return isLocale(v) ? v : DEFAULT_LOCALE;
});

/** Current locale: cookie → settings default_lang → DEFAULT_LOCALE. */
export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(v)) return v;
  return getDefaultLocale();
}
