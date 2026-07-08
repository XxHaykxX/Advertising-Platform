/* Currency core (client-safe). Mirrors src/lib/i18n.ts conventions: the
   chosen currency is stored in the `currency` cookie and drives server-side
   price conversion. Admins always enter AMD; everything below exists to
   convert and format that AMD amount for display in the visitor's chosen
   currency. */

import { intlLocale, type Locale } from "@/lib/i18n";

export const CURRENCIES = ["AMD", "USD", "EUR", "RUB"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];
export const DEFAULT_CURRENCY: CurrencyCode = "AMD";
export const CURRENCY_COOKIE = "currency";

export function isCurrency(v: unknown): v is CurrencyCode {
  return typeof v === "string" && (CURRENCIES as readonly string[]).includes(v);
}

export type Rates = Record<CurrencyCode, number>;

/** Symbol + placement per currency. AMD/RUB use a suffix symbol; USD/EUR use
 *  a prefix — do NOT rely on Intl's currency symbol formatting for AMD, it's
 *  inconsistent across environments. */
function applySymbol(currency: CurrencyCode, numStr: string): string {
  switch (currency) {
    case "AMD":
      return `${numStr} ֏`;
    case "RUB":
      return `${numStr} ₽`;
    case "EUR":
      return `€${numStr}`;
    case "USD":
    default:
      return `$${numStr}`;
  }
}

/** AMD/RUB amounts are always whole units; USD/EUR default to whole units too
 *  but callers can ask for more precision (e.g. CPM, which is tiny in
 *  USD/EUR). */
function resolveDecimals(currency: CurrencyCode, opts?: { decimals?: number }): number {
  if (currency === "AMD" || currency === "RUB") return 0;
  return opts?.decimals ?? 0;
}

/** Convert an AMD amount into `currency` and format it with the right symbol
 *  and grouping for `locale`. Pure — callers supply the daily rates. */
export function formatMoney(
  amdAmount: number,
  currency: CurrencyCode,
  rates: Rates,
  locale: Locale,
  opts?: { decimals?: number },
): string {
  const converted = amdAmount * (rates[currency] ?? 1);
  const decimals = resolveDecimals(currency, opts);
  const numStr = new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(converted);
  return applySymbol(currency, numStr);
}

/** Format an AMD min/max pair as "a – b", or a single formatted value when
 *  only one bound is set or both bounds are equal. Returns "" when both
 *  bounds are null (caller decides what to render instead, e.g. an
 *  "on request" label). */
export function formatMoneyRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: CurrencyCode,
  rates: Rates,
  locale: Locale,
  opts?: { decimals?: number },
): string {
  if (min == null && max == null) return "";
  if (min == null) return formatMoney(max as number, currency, rates, locale, opts);
  if (max == null) return formatMoney(min, currency, rates, locale, opts);
  if (min === max) return formatMoney(min, currency, rates, locale, opts);
  return `${formatMoney(min, currency, rates, locale, opts)} – ${formatMoney(max, currency, rates, locale, opts)}`;
}
