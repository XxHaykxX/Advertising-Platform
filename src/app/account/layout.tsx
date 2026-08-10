import type { ReactNode } from "react";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { PushSubscribe } from "@/components/notifications/push-subscribe";
import { NotificationToaster } from "@/components/notifications/notification-toaster";

/** Gate: only approved, active members (BRAND / CREATOR) reach anything under
 *  /account — requireMember() redirects to /login otherwise.
 *
 *  This layout only supplies the chrome every side shares (header/footer/push).
 *  Which cabinet shell wraps `children` — the creator's sticky sidebar or the
 *  brand's — used to be picked here by `role`, but a dual member's role no
 *  longer says which side they're looking at (2026-08-11: see capabilities.ts).
 *  Each side now supplies its own shell as a nested layout instead:
 *  account/(creator)/layout.tsx and account/brand/layout.tsx. */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await requireMember();
  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader knownUser={user} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} currency={currency} minimal />
      <PushSubscribe locale={locale} vapidPublicKey={process.env.VAPID_PUBLIC_KEY ?? ""} scope="member" />
      <NotificationToaster locale={locale} />
    </div>
  );
}
