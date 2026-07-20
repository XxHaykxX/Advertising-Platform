import type { ReactNode } from "react";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { makeUI } from "@/lib/i18n";
import { Container } from "@/components/ui/container";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { CreatorSidebar } from "./creator-sidebar";
import { logout } from "./actions";

/** Gate: only approved, active members (BRAND / CREATOR) reach anything under
 *  /account — requireMember() redirects to /login otherwise.
 *
 *  CREATOR members get their two-column cabinet shell (sticky left sidebar +
 *  content) right here, so every /account/* creator page renders bare (no
 *  Section/Container of its own). BRAND members are NOT wrapped here — their
 *  own nested /account/brand/layout.tsx supplies the brand sidebar shell, so
 *  wrapping them twice would double the chrome. */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await requireMember();
  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);
  const t = makeUI(locale);
  const isCreator = user.role === "CREATOR";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      {isCreator ? (
        <div className="flex-1">
          <Container className="py-10">
            <div className="flex flex-col gap-8 lg:flex-row">
              <CreatorSidebar
                labels={{
                  home: t("account.title"),
                  projects: t("account.myProjects"),
                  submit: t("account.submitProject"),
                  notifications: t("notif.title"),
                  profile: t("account.profile"),
                  logout: t("account.logout"),
                }}
                logoutAction={logout}
                locale={locale}
              />
              <main className="min-w-0 flex-1">{children}</main>
            </div>
          </Container>
        </div>
      ) : (
        <main className="flex-1">{children}</main>
      )}
      <Footer locale={locale} currency={currency} />
    </div>
  );
}
