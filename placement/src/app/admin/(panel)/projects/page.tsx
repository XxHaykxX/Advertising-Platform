import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require";
import { SafetyBadge } from "@/components/ui/badge";
import { ActiveToggle, DeleteButton } from "./row-actions";

const STATUS_LABEL: Record<string, string> = {
  PRE_PRODUCTION: "Pre-production",
  FILMING: "Filming",
  POST_PRODUCTION: "Post-production",
  RELEASED: "Released",
};

export default async function ProjectsAdminPage() {
  const user = await requireUser();
  const isSuperadmin = user.role === "SUPERADMIN";

  const projects = await prisma.project.findMany({
    // Publisher scoping: a Publisher only ever sees their own projects.
    // SUPERADMIN sees everything.
    where: isSuperadmin ? undefined : { ownerId: user.id },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { opportunities: true } },
      owner: { select: { name: true } },
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">{projects.length} in catalog</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">
          No projects.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Poster</th>
                <th className="px-4 py-3 font-medium">Title / Code</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Safety</th>
                <th className="px-4 py-3 font-medium">Opportunities</th>
                <th className="px-4 py-3 font-medium">Active</th>
                {isSuperadmin && <th className="px-4 py-3 font-medium">Owner</th>}
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="h-10 w-16 overflow-hidden rounded bg-muted">
                      {p.poster && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.poster} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/projects/${p.id}/edit`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{p.code}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {STATUS_LABEL[p.status] ?? p.status}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <SafetyBadge safety={p.safety} />
                      <span className="text-xs text-muted-foreground">{p.safetyScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p._count.opportunities}</td>
                  <td className="px-4 py-3">
                    <ActiveToggle id={p.id} active={p.isActive} />
                  </td>
                  {isSuperadmin && (
                    <td className="px-4 py-3 text-muted-foreground">{p.owner.name}</td>
                  )}
                  <td className="px-4 py-3">
                    <DeleteButton id={p.id} title={p.title} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
