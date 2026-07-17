import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { getNotifications } from "@/lib/data/notifications";
import { NotificationList } from "@/components/notifications/notification-list";

/** BRAND cabinet notifications feed (#25 / V9) — mostly INTEREST-echo and,
 *  once the two-sided reveal lands, mutual signals. Same requireMember + role
 *  gate as the sibling brand pages. */
export default async function BrandNotificationsPage() {
  const user = await requireMember();
  if (user.role !== "BRAND") redirect("/account");

  const locale = await getLocale();
  const t = makeUI(locale);
  const rows = await getNotifications(user.id);
  const items = rows.map((n) => ({
    id: n.id,
    type: n.type,
    data: n.data,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t("notif.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("notif.subtitle")}</p>
      <div className="mt-8">
        <NotificationList items={items} locale={locale} />
      </div>
    </div>
  );
}
