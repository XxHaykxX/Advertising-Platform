import { requireUser } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { getNotifications } from "@/lib/data/notifications";
import { NotificationList } from "@/components/notifications/notification-list";

/* #V9 admin nav entry: staff-side notification inbox, mirrors the account-
   side page but scoped to the signed-in staff user's own rows. */
export default async function AdminNotificationsPage() {
  const user = await requireUser();
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("notif.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("notif.subtitle")}</p>
      </div>
      <div className="mt-6">
        <NotificationList items={items} locale={locale} />
      </div>
    </div>
  );
}
