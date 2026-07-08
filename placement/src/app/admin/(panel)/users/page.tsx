import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { RowActions } from "./user-form";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(d);
}

export default async function UsersAdminPage() {
  const me = await requireSuperadmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { projects: true } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">{users.length} accounts</p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[--primary-hover] btn-glow"
        >
          <Plus className="h-4 w-4" />
          New publisher
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Company name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Projects</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border align-top last:border-b-0 hover:bg-muted/50">
                <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      u.role === "SUPERADMIN"
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {u.role === "SUPERADMIN" ? "Super-admin" : "Publisher"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      u.isActive
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {u.isActive ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u._count.projects}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <RowActions id={u.id} isActive={u.isActive} isSelf={u.id === me.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
