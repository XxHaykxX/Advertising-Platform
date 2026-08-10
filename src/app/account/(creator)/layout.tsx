import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth/require";
import { canSell, canBuy } from "@/lib/auth/capabilities";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { CreatorSidebar } from "../creator-sidebar";
import { CreatorShell } from "../creator-shell";
import { logout } from "../actions";

/** Gate + shell for the creator side of the cabinet (2026-08-11, dual-side
 *  accounts) — this is a route GROUP, so the parens don't appear in the URL
 *  and every existing /account/... href keeps working. Every page that used
 *  to sit directly under /account/* now lives here and shares this one check
 *  instead of each repeating it. requireMember() is re-called
 *  (loadCurrentMember is React-cached, so this costs no extra query) because
 *  a layout doesn't inherit its parent's already-resolved user. A member who
 *  can't sell is bounced to their brand cabinet, same as the individual
 *  per-page checks this replaces.
 *
 *  🔴 The `&& canBuy(user)` half is not decorative — it's what stops a member
 *  with BOTH flags false (a hand-edited row, or a Google sign-up that missed
 *  the flag write) from ping-ponging forever between here and
 *  account/brand/layout.tsx, whose own gate unconditionally bounces
 *  !canBuy(user) back to /account. That layout is the one place this login
 *  is allowed to land and actually render instead of redirect again.
 *
 *  The CreatorShell (sticky sidebar + content) used to be picked by `role` in
 *  the parent account/layout.tsx — moved down here for the same reason as the
 *  gate: role no longer says which side a dual member is looking at. */
export default async function CreatorGroupLayout({ children }: { children: ReactNode }) {
  const user = await requireMember();
  if (!canSell(user) && canBuy(user)) redirect("/account/brand");

  const locale = await getLocale();
  const t = makeUI(locale);

  return (
    <CreatorShell
      sidebar={
        <CreatorSidebar
          labels={{
            projects: t("account.myProjects"),
            submit: t("account.submitProject"),
            adSpaces: t("adSpace.mine"),
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
  );
}
