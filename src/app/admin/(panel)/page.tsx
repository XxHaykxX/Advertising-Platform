import Link from "next/link";
import { redirect } from "next/navigation";
import { Film, ShieldCheck, UserRound, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require";
import { isTranslatorOnly } from "@/lib/auth/permissions";
import { makeUI } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  const user = await requireUser();

  // TRANSLATOR has no use for this dashboard (no projects/user counts to
  // show) — send it straight to its only section, before any DB reads.
  if (isTranslatorOnly(user.role)) {
    redirect("/admin/i18n");
  }

  // English-only panel — see the note in interests/page.tsx.
  const t = makeUI("en");

  const isSuperadmin = user.role === "SUPERADMIN";
  // MODERATOR never owns projects, so an "ownerId" count would always read 0
  // (audit 7) — it gets the moderation queue count instead.
  const isModerator = user.role === "MODERATOR";

  // Publishers only ever see their own projects; a super-admin gets the
  // platform-wide counts (only what's actually live in the catalog / actual
  // staff accounts — audit 7 found both cards counting more than their
  // label promised); a moderator gets the pending-review queue.
  const [projectCount, userCount, memberCount, moderationQueueCount] = await Promise.all([
    isSuperadmin
      ? prisma.project.count({ where: { isActive: true, moderationStatus: "APPROVED" } })
      : isModerator
        ? Promise.resolve(0)
        : prisma.project.count({ where: { ownerId: user.id } }),
    isSuperadmin
      ? prisma.user.count({ where: { role: { in: ["SUPERADMIN", "PUBLISHER", "MODERATOR", "TRANSLATOR"] } } })
      : Promise.resolve(null),
    // The brands and creators who actually use the marketplace. The staff
    // count above sat alone on the dashboard reading "Users 5", so the six
    // members were nowhere on the overview at all (QA pass, 2026-08-14).
    isSuperadmin
      ? prisma.user.count({ where: { role: { in: ["BRAND", "CREATOR"] } } })
      : Promise.resolve(null),
    isModerator ? prisma.project.count({ where: { moderationStatus: "PENDING" } }) : Promise.resolve(null),
  ]);

  const cards = isModerator
    ? [
        {
          label: t("admin.dashboard.moderationQueue"),
          value: moderationQueueCount ?? 0,
          sub: t("admin.dashboard.pendingReview"),
          icon: ShieldCheck,
          href: "/admin/moderation",
        },
      ]
    : [
        {
          label: "Projects",
          value: projectCount,
          sub: isSuperadmin ? "in catalog" : "your projects",
          icon: Film,
          href: "/admin/projects",
        },
        ...(isSuperadmin
          ? [
              {
                label: "Members",
                value: memberCount ?? 0,
                sub: "brands & creators",
                icon: UserRound,
                href: "/admin/users",
              },
              {
                label: "Staff",
                value: userCount ?? 0,
                sub: "admins & publishers",
                icon: Users,
                href: "/admin/users",
              },
            ]
          : []),
      ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Welcome, {user.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isSuperadmin
          ? "Platform overview."
          : isModerator
            ? "Projects awaiting your review."
            : "Your placement projects at a glance."}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="card-lift rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {c.label}
              </span>
              <c.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-foreground">{c.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
          </Link>
        ))}
      </div>

      {/* "Manage projects" and "Manage users" were removed on 2026-08-05 (owner
          decision): both duplicate a sidebar entry that is on screen anyway, so
          the row was a second door to the same two rooms. The moderator's
          button stays — a MODERATOR 404s on /admin/projects and its sidebar is
          the shortest in the panel, so this is the one shortcut that earns its
          place (audit 7 / 3.2). */}
      {isModerator && (
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/moderation">{t("admin.dashboard.moderationQueue")}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
