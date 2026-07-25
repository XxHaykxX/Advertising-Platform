import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require";
import { PlainProjectsTable, ReorderableProjectsTable, type ProjectRow } from "./reorder-list";

export default async function ProjectsAdminPage() {
  const user = await requireUser();
  const isSuperadmin = user.role === "SUPERADMIN";

  const projects = await prisma.project.findMany({
    // Publisher scoping: a Publisher only ever sees their own projects.
    // SUPERADMIN sees everything.
    where: isSuperadmin ? undefined : { ownerId: user.id },
    orderBy: { sortOrder: "asc" },
    include: {
      owner: { select: { name: true } },
    },
  });

  const rows: ProjectRow[] = projects.map((p) => ({
    id: p.id,
    poster: p.poster,
    title: p.title,
    isActive: p.isActive,
    ownerName: p.owner.name,
  }));

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
      ) : isSuperadmin ? (
        // T2: catalog display order (sortOrder — see src/lib/data/projects.ts)
        // is a single global sequence, so drag-to-reorder only makes sense
        // from the superadmin's full-list view.
        <div className="mt-6">
          <ReorderableProjectsTable projects={rows} />
        </div>
      ) : (
        <div className="mt-6">
          <PlainProjectsTable projects={rows} />
        </div>
      )}
    </div>
  );
}
