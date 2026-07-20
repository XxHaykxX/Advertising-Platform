import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, FileUp, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { requireMember } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { getUnreadNotificationCount } from "@/lib/actions/notifications";

/* CREATOR cabinet home. The profile card + logout that used to live here moved
   to the sidebar (creator-sidebar.tsx) + the dedicated /account/profile page,
   and the Section/Container wrapper is now supplied by account/layout.tsx's
   creator shell — so this page renders bare: a welcome heading + the three
   action cards (submit / my projects / notifications). BRAND members are sent
   to their own cabinet. */

export default async function AccountPage() {
  const user = await requireMember();
  // F13: BRAND members have a full cabinet at /account/brand — send them there.
  if (user.role === "BRAND") redirect("/account/brand");

  const [locale, projectsCount, unreadCount] = await Promise.all([
    getLocale(),
    prisma.project.count({ where: { ownerId: user.id } }),
    getUnreadNotificationCount(),
  ]);
  const t = makeUI(locale);

  return (
    <div>
      <Reveal>
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">{t("account.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("account.welcome", { name: user.name })}</p>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Reveal delay={0.05}>
          <div className="flex h-full flex-col items-start rounded-2xl border border-border bg-card p-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileUp className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {t("account.submitProject")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("account.submitProjectSubtitle")}
            </p>
            <Button asChild variant="primary" size="md" className="mt-6">
              <Link href="/account/projects/new">{t("account.submitProject")}</Link>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="flex h-full flex-col items-start rounded-2xl border border-border bg-card p-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <FolderKanban className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {t("account.myProjects")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {projectsCount > 0
                ? t("account.projectsCount", { count: projectsCount })
                : t("account.noProjects")}
            </p>
            <Button asChild variant="secondary" size="md" className="mt-6">
              <Link href="/account/projects">{t("account.myProjects")}</Link>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="flex h-full flex-col items-start rounded-2xl border border-border bg-card p-6">
            <div className="flex w-full items-center justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
              </div>
              {unreadCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">{t("notif.title")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("notif.subtitle")}</p>
            <Button asChild variant="secondary" size="md" className="mt-6">
              <Link href="/account/notifications">{t("notif.title")}</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
