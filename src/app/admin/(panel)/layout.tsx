import { requireUser } from "@/lib/auth/require";
import { AdminShell } from "./admin-shell";
import { PushSubscribe } from "@/components/notifications/push-subscribe";
import { clientDict } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n-client";

export default async function PanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Defense in depth — the proxy guard already checks the JWT alone;
  // requireUser() re-checks isActive against the DB, so a deactivated
  // Publisher is locked out of every panel page on the very next request
  // (redirects to /admin/login). Nav-hiding (inside AdminNav) is UX only —
  // every super-admin-only route still enforces requireSuperadmin() server
  // side, so a Publisher typing the URL directly is blocked regardless of
  // what's rendered here.
  const user = await requireUser();

  // The panel chrome is English-only whatever locale the visitor picked, so it
  // needs the `en` slice on top of the visitor's one from the root layout —
  // client components here call makeUI("en") and would otherwise resolve
  // against the visitor's language.
  return (
    <I18nProvider dicts={{ en: clientDict("en") }}>
      <AdminShell role={user.role} name={user.name} email={user.email}>
        {children}
        {/* Staff could receive notifications but had no way to turn browser push
            on: the prompt was mounted only in the member cabinet. So a new offer
            created an in-app row and then tried to push to an account that could
            never have had a subscription. English, like the rest of the panel. */}
        <PushSubscribe locale="en" vapidPublicKey={process.env.VAPID_PUBLIC_KEY ?? ""} />
      </AdminShell>
    </I18nProvider>
  );
}
