"use client";

/* Client-side counterpart to i18n.ts (server-only, see the guard there).
   Carries no dictionary data itself — a layout computes the per-locale slice
   server-side (clientDict() in i18n.ts) and hands it down through
   <I18nProvider>. makeUI() keeps the exact signature and fallback behavior of
   its server counterpart, so call sites in client components don't change at
   all — only the import path. Value localization is the one exception: it is
   `useLocalizer(locale)` here, not `localizeValue(locale, ...)` — see the note
   above that function (bundle audit 2026-07-31, task #18).

   Why React context and not a module-level variable: on the server this module
   is one instance shared by every in-flight request. A provider that assigned
   the active dictionary to a module variable during render would be overwritten
   by the next concurrent request the moment the first one awaited anything —
   an `hy` visitor served a `ru` page, intermittently and only under load.
   Context is scoped to the render tree, so concurrent requests can't collide.

   Both functions read context, which makes them hooks in all but name: call
   them in a component body, never at module scope or inside a callback. */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  intlLocale,
  type Locale,
} from "@/lib/i18n-base";

export { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, intlLocale };
export type { Locale };

export type Dicts = Partial<Record<Locale, Record<string, string>>>;

type I18nValue = {
  /** The visitor's locale — what a `t()` resolves against by default. */
  locale: Locale;
  /** Per-locale slices. Usually just the visitor's; the admin panel adds `en`
   *  because its chrome is English-only regardless of who is looking at it. */
  dicts: Dicts;
};

const I18nContext = createContext<I18nValue>({ locale: DEFAULT_LOCALE, dicts: {} });

/**
 * Wraps the app once in the root layout with the visitor's slice. Nesting is
 * allowed and merges: the admin layout adds an `en` slice on top without
 * disturbing the locale everything else resolves against.
 */
export function I18nProvider({
  locale,
  dicts,
  children,
}: {
  /** Omit inside a nested provider to keep the one from above. */
  locale?: Locale;
  dicts: Dicts;
  children: ReactNode;
}) {
  const parent = useContext(I18nContext);
  const value = useMemo<I18nValue>(
    () => ({ locale: locale ?? parent.locale, dicts: { ...parent.dicts, ...dicts } }),
    [locale, parent.locale, parent.dicts, dicts],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Slice for `locale`, falling back to the visitor's own when a caller asks for
 *  a language nobody supplied (a bare key is better than a silently wrong one,
 *  and the dev warning below points at the missing provider). */
function useDict(locale: Locale): Record<string, string> {
  const { locale: active, dicts } = useContext(I18nContext);
  const dict = dicts[locale];
  if (dict) return dict;
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[i18n-client] no dictionary slice for "${locale}" — falling back to ` +
        `"${active}". Add it to the nearest <I18nProvider dicts={...}>.`,
    );
  }
  return dicts[active] ?? {};
}

/**
 * Localize raw DB values from a closed set (genre, role, category, ...) via
 * `${prefix}.${value}` dict keys. Falls back to the raw value when there's no
 * translation (e.g. a custom genre an admin typed), so nothing ever renders a
 * bare key. Same lookup as localizeValue() in i18n.ts, with one difference
 * that matters: there is deliberately NO client `localizeValue(locale, ...)`
 * to import. Such a function would have to read context on every call, and
 * every real call site here localizes inside a `.map()` — genres on a card,
 * roles under a headshot — which would tie the hook count to the list length
 * and break rendering the moment a list grows or shrinks. Reading the
 * dictionary once, at the top of the component, is the only safe shape.
 */
export function useLocalizer(locale: Locale) {
  const dict = useDict(locale);
  return function localize(prefix: string, value: string | null | undefined): string {
    if (!value) return "";
    return dict[`${prefix}.${value}`] ?? value;
  };
}

export function makeUI(locale: Locale) {
  const dict = useDict(locale);
  return function t(key: string, vars?: Record<string, string | number>): string {
    let s = dict[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  };
}
