import type { ReactNode } from "react";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { makeUI } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { PushSubscribe } from "@/components/notifications/push-subscribe";
import { NotificationToaster } from "@/components/notifications/notification-toaster";
import { CreatorSidebar } from "./creator-sidebar";
import { CreatorShell } from "./creator-shell";
import { logout } from "./actions";

/** Gate: only approved, active members (BRAND / CREATOR) reach anything under
 *  /account — requireMember() redirects to /login otherwise.
 *
 *  CREATOR members get their cabinet shell (sticky left sidebar + content) via
 *  CreatorShell, so every /account/* creator page renders bare (no
 *  Section/Container of its own). The shell drops the sidebar and widens out on
 *  the two project-form routes — see creator-shell.tsx. BRAND members are NOT
 *  wrapped here — their
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
        <CreatorShell
          sidebar={
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
          }
        >
          {children}
        </CreatorShell>
      ) : (
        <main className="flex-1">{children}</main>
      )}
      <Footer locale={locale} currency={currency} minimal />
      <PushSubscribe locale={locale} vapidPublicKey={process.env.VAPID_PUBLIC_KEY ?? ""} />
      <NotificationToaster locale={locale} />
    </div>
  );
}
