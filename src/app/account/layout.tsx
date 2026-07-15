import type { ReactNode } from "react";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

/** Gate: only approved, active members (BRAND / CREATOR) reach anything under
 *  /account — requireMember() redirects to /login otherwise. */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireMember();
  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} currency={currency} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} currency={currency} />
    </div>
  );
}
