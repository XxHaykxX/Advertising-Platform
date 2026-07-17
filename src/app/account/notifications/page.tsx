import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { getNotifications } from "@/lib/data/notifications";
import { NotificationList } from "@/components/notifications/notification-list";

/** CREATOR cabinet notifications feed (#25 / V9) — mirrors the BRAND page at
 *  /account/brand/notifications, but wraps itself in Section/Container/Reveal
 *  like the sibling account/projects/page.tsx (the CREATOR side has no shared
 *  layout.tsx shell the way /account/brand does). BRAND members are
 *  redirected to their own cabinet since this page lives under the
 *  CREATOR-facing /account root. */
export default async function AccountNotificationsPage() {
  const user = await requireMember();
  if (user.role !== "CREATOR") redirect("/account/brand");

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
    <Section>
      <Container>
        <Reveal>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">{t("notif.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("notif.subtitle")}</p>
        </Reveal>

        <Reveal delay={0.05} className="mt-10">
          <NotificationList items={items} locale={locale} />
        </Reveal>
      </Container>
    </Section>
  );
}
