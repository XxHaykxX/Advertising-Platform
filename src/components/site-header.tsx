import "server-only";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { getSiteHeaderUser } from "@/lib/data/site-header-user";
import { Header } from "@/components/header";

/** Server wrapper around the (client) Header — the single place that loads
 *  the current session's user, locale and currency, so page files don't have
 *  to thread them through by hand. Guests get `user: null` and Header falls
 *  back to the guest "Sign In / Up" button. */
export async function SiteHeader() {
  const [user, locale, currency] = await Promise.all([
    getSiteHeaderUser(),
    getLocale(),
    getCurrency(),
  ]);

  return <Header user={user} locale={locale} currency={currency} />;
}
