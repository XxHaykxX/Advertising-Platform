import { requireStaffExceptTranslator } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { getNotificationItems } from "@/lib/data/notifications";
import { NotificationList } from "@/components/notifications/notification-list";

/* #V9 admin nav entry: staff-side notification inbox, mirrors the account-
   side page but scoped to the signed-in staff user's own rows. Audit 3.4:
   TRANSLATOR's only admin page is /admin/i18n — gated accordingly so this
   404s for that role instead of being reachable by direct URL. */
export default async function AdminNotificationsPage() {
  const user = await requireStaffExceptTranslator();
  const locale = await getLocale();
  const t = makeUI(locale);
  const items = await getNotificationItems(user.id);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("notif.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("notif.subtitle")}</p>
      </div>
      <div className="mt-6">
        <NotificationList items={items} locale={locale} scope="staff" />
      </div>
    </div>
  );
}
