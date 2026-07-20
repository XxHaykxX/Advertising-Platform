import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { logout } from "../actions";
import { BrandSidebar } from "./brand-sidebar";

/** Gate + shell for the BRAND cabinet (#23). SiteHeader/Footer are already
 *  supplied by the parent /account/layout.tsx (requireMember() there is
 *  re-checked here too — defense in depth, same pattern as
 *  account/projects/page.tsx) — this layout only adds the two-column
 *  sidebar+content shell. CREATOR members (and anyone else) are bounced back
 *  to /account, which routes them to their own cabinet. */
export default async function BrandLayout({ children }: { children: ReactNode }) {
  const user = await requireMember();
  if (user.role !== "BRAND") redirect("/account");

  const locale = await getLocale();
  const t = makeUI(locale);

  return (
    <Container className="py-10">
      <div className="flex flex-col gap-8 lg:flex-row">
        <BrandSidebar
          labels={{
            dashboard: t("account.title"),
            browse: t("nav.browseProjects"),
            favorites: t("account.brand.navFavorites"),
            profile: t("account.brand.navProfile"),
            notifications: t("account.brand.navNotifications"),
            logout: t("account.logout"),
          }}
          logoutAction={logout}
          locale={locale}
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </Container>
  );
}
