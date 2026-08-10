import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth/require";
import { canSell } from "@/lib/auth/capabilities";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { ProfileForm } from "./profile-form";

/** CREATOR "My Profile" — edit display name + avatar. Renders bare (the
 *  account/layout.tsx creator shell supplies the Container + sidebar). A
 *  member who can't sell has their own profile at /account/brand/profile —
 *  bounce them. */
export default async function CreatorProfilePage() {
  const user = await requireMember();
  if (!canSell(user)) redirect("/account/brand");

  const locale = await getLocale();
  const t = makeUI(locale);
  const [dbUser, projectsTotal, projectsApproved] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        avatar: true,
        phone: true,
        website: true,
        createdAt: true,
        role: true,
        status: true,
      },
    }),
    prisma.project.count({ where: { ownerId: user.id } }),
    prisma.project.count({ where: { ownerId: user.id, moderationStatus: "APPROVED" } }),
  ]);

  const memberSince = dbUser?.createdAt
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(dbUser.createdAt)
    : "";

  // Was hardcoded to "Approved" in the markup, so a blocked account was told
  // it was in good standing (2026-08-07). Read it from the row instead.
  const statusKey = {
    PENDING: "admin.registrations.statusPending",
    APPROVED: "admin.registrations.statusApproved",
    REJECTED: "admin.registrations.statusRejected",
    BLOCKED: "admin.registrations.statusBlocked",
  } as const;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t("account.profile")}</h1>
      <p className="mt-2 text-muted-foreground">{t("account.profile.subtitle")}</p>

      {/* The form first — it's what the page is for. The read-only figures
          below it are reference, not a task (2026-08-07). */}
      <ProfileForm
        name={dbUser?.name ?? user.name}
        email={dbUser?.email ?? user.email}
        avatar={dbUser?.avatar ?? ""}
        phone={dbUser?.phone ?? ""}
        website={dbUser?.website ?? ""}
        locale={locale}
      />

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">{t("account.profile.stats")}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted-foreground">{t("account.profile.memberSince")}</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">{memberSince}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{t("admin.registrations.colRole")}</dt>
            {/* Safe as a constant: a non-CREATOR was redirected above. */}
            <dd className="mt-1 text-sm font-semibold text-foreground">{t("account.roleCreator")}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{t("admin.registrations.colStatus")}</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              {t(statusKey[dbUser?.status ?? "APPROVED"])}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{t("account.profile.projectsTotal")}</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">{projectsTotal}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{t("account.profile.projectsApproved")}</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">{projectsApproved}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
