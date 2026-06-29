import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ActiveToggle, DeleteButton } from "./row-actions";

export default async function ProjectsAdminPage() {
  const projects = await prisma.project.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { actors: true, scenes: true } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-white/55">{projects.length} in catalog</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-600"
        >
          <Plus className="h-4 w-4" />
          New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center text-white/50">
          No projects.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs uppercase tracking-wide text-white/45">
                <th className="px-4 py-3 font-medium">Poster</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Genre</th>
                <th className="px-4 py-3 font-medium">Slots</th>
                <th className="px-4 py-3 font-medium">Cast / Scenes</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="h-10 w-16 overflow-hidden rounded bg-white/5">
                      {p.poster && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.poster} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/projects/${p.id}/edit`} className="font-medium text-foreground hover:text-primary">
                      {p.titleRu}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/60">{p.genreRu || "—"}</td>
                  <td className="px-4 py-3 text-white/60">{p.slotsAvailable}/{p.slotsTotal}</td>
                  <td className="px-4 py-3 text-white/60">{p._count.actors} / {p._count.scenes}</td>
                  <td className="px-4 py-3"><ActiveToggle id={p.id} active={p.isActive} /></td>
                  <td className="px-4 py-3"><DeleteButton id={p.id} title={p.titleRu} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
