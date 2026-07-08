import "server-only";
import { CURRENCIES, type CurrencyCode, type Rates } from "@/lib/currency";

// Free, no-key, AMD-base daily FX feed. Response shape (relevant parts):
// { "result": "success", "rates": { "AMD": 1, "USD": 0.00272, ... } }
const RATES_URL = "https://open.er-api.com/v6/latest/AMD";

// Sane recent snapshot — used whenever the feed is down, returns malformed
// data, or the request fails outright. A rates outage must never 500 the
// catalog/report pages.
const FALLBACK_RATES: Rates = {
  AMD: 1,
  USD: 0.00272,
  EUR: 0.00238,
  RUB: 0.208,
};

/** Current AMD -> {AMD,USD,EUR,RUB} exchange rates. Cached via Next's fetch
 *  cache for 24h (`revalidate: 86400`), so the free API is hit at most once a
 *  day rather than once per request. Never throws. */
export async function getRates(): Promise<Rates> {
  try {
    // Hard 3s timeout: on shared hosting outbound can hang instead of failing,
    // and a hanging await (unlike a thrown error) is NOT caught below — it would
    // stall the SSR render and 503 the page. AbortSignal.timeout rejects the
    // fetch after 3s, which the catch turns into the fallback snapshot.
    const res = await fetch(RATES_URL, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return FALLBACK_RATES;
    const data = await res.json();
    if (data?.result !== "success" || typeof data?.rates !== "object") return FALLBACK_RATES;
    const rates = {} as Rates;
    for (const code of CURRENCIES as readonly CurrencyCode[]) {
      const r = data.rates[code];
      rates[code] = typeof r === "number" ? r : FALLBACK_RATES[code];
    }
    return rates;
  } catch {
    return FALLBACK_RATES;
  }
}
