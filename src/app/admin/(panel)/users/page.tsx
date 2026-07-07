import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { formatDateTime } from "@/lib/data/format";
import { RowActions } from "./row-actions";

export default async function UsersAdminPage() {
  const me = await requireSuperadmin();

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="mt-1 text-sm text-white/55">{users.length} accounts</p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-600"
        >
          <Plus className="h-4 w-4" />
          New publisher
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs uppercase tracking-wide text-white/45">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Company name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5 align-top hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-medium text-foreground">{u.email}</td>
                <td className="px-4 py-3 text-white/70">{u.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      u.role === "SUPERADMIN"
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-white/15 bg-white/5 text-white/70"
                    }`}
                  >
                    {u.role === "SUPERADMIN" ? "Super-admin" : "Publisher"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      u.isActive
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-white/15 bg-white/5 text-white/45"
                    }`}
                  >
                    {u.isActive ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/55">{formatDateTime(u.createdAt)}</td>
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
