import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireContentEditor } from "@/lib/auth/require";
import { PlainProjectsTable, ReorderableProjectsTable, type ProjectRow } from "./reorder-list";

export default async function ProjectsAdminPage() {
  // Content-editor gate (not requireUser): MODERATOR and TRANSLATOR have no
  // business here, and requireUser() used to render them the panel shell with
  // an empty list instead of the 404 every other section gives them.
  const user = await requireContentEditor();
  const isSuperadmin = user.role === "SUPERADMIN";

  const projects = await prisma.project.findMany({
    where: {
      // Only what has already been decided on. A creator's submission waiting
      // for moderation used to sit in this list looking like an ordinary
      // inactive project — nothing distinguished "waiting for a decision"
      // from "approved but taken off the catalog", so a pending project read
      // as one somebody had simply switched off. The queue lives in
      // /admin/moderation; a project appears here once it is approved.
      moderationStatus: "APPROVED",
      // Publisher scoping: a Publisher only ever sees their own projects.
      // SUPERADMIN sees everything.
      ...(isSuperadmin ? {} : { ownerId: user.id }),
    },
    orderBy: { sortOrder: "asc" },
    include: {
      owner: { select: { name: true } },
    },
  });

  // Waiting for a decision — surfaced as a line pointing at the queue, so a
  // submission can't go unnoticed just because this list no longer shows it.
  const awaitingModeration = await prisma.project.count({
    where: {
      moderationStatus: { in: ["PENDING", "REJECTED"] },
      ...(isSuperadmin ? {} : { ownerId: user.id }),
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
          {/* "in catalog" used to count every row, including the ones not in
              the catalog at all. Count what the visitor can actually see. */}
          <p className="mt-1 text-sm text-muted-foreground">
            {projects.filter((p) => p.isActive).length} in catalog
            {projects.length !== projects.filter((p) => p.isActive).length
              ? ` · ${projects.length - projects.filter((p) => p.isActive).length} unpublished`
              : ""}
          </p>
          {awaitingModeration > 0 ? (
            <p className="mt-1 text-sm">
              <Link href="/admin/moderation" className="text-warn hover:underline">
                {awaitingModeration} awaiting moderation →
              </Link>
            </p>
          ) : null}
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
