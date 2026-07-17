import Link from "next/link";
import { Film, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  const user = await requireUser();
  const isSuperadmin = user.role === "SUPERADMIN";

  // Publishers only ever see their own projects; a super-admin gets the
  // platform-wide counts (all projects, all users).
  const [projectCount, userCount] = await Promise.all([
    isSuperadmin
      ? prisma.project.count()
      : prisma.project.count({ where: { ownerId: user.id } }),
    isSuperadmin ? prisma.user.count() : Promise.resolve(null),
  ]);

  const cards = [
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
            label: "Users",
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
        {isSuperadmin ? "Platform overview." : "Your placement projects at a glance."}
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

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/admin/projects">Manage projects</Link>
        </Button>
        {isSuperadmin && (
          <Button asChild variant="secondary">
            <Link href="/admin/users">Manage users</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
