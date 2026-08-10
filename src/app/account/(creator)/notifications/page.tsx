import { redirect } from "next/navigation";
import { Reveal } from "@/components/ui/reveal";
import { requireMember } from "@/lib/auth/require";
import { canSell } from "@/lib/auth/capabilities";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { getNotificationItems } from "@/lib/data/notifications";
import { NotificationList } from "@/components/notifications/notification-list";

/** CREATOR cabinet notifications feed (#25 / V9) — mirrors the BRAND page at
 *  /account/brand/notifications. The CREATOR side now has a shared shell in
 *  account/layout.tsx that supplies the Container, so this page renders bare
 *  (no Section/Container of its own). BRAND members are redirected to their
 *  own cabinet since this page lives under the CREATOR-facing /account root. */
export default async function AccountNotificationsPage() {
  const user = await requireMember();
  if (!canSell(user)) redirect("/account/brand");

  const locale = await getLocale();
  const t = makeUI(locale);
  const items = await getNotificationItems(user.id);

  return (
    <>
      <Reveal>
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">{t("notif.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("notif.subtitle")}</p>
      </Reveal>

      <Reveal delay={0.05} className="mt-10">
        <NotificationList items={items} locale={locale} scope="member" />
      </Reveal>
    </>
  );
}
