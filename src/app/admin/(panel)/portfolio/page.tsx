import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { RowActions } from "./row-actions";

function firstImage(images: string): string | null {
  try {
    const a = JSON.parse(images);
    return Array.isArray(a) && a.length ? String(a[0]) : null;
  } catch {
    return null;
  }
}

export default async function PortfolioAdminPage() {
  const items = await prisma.portfolio.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          <p className="mt-1 text-sm text-white/55">{items.length} cases</p>
        </div>
        <Link href="/admin/portfolio/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-600">
          <Plus className="h-4 w-4" />
          New case
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center text-white/50">No cases.</div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs uppercase tracking-wide text-white/45">
                <th className="px-4 py-3 font-medium">Cover</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Video</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const cover = firstImage(it.images);
                return (
                  <tr key={it.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <div className="h-10 w-16 overflow-hidden rounded bg-white/5">
                        {cover && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={cover} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/portfolio/${it.id}/edit`} className="font-medium text-foreground hover:text-primary">
                        {it.titleRu}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-white/55">
                      {it.videoUrl || it.videoFile ? it.videoType : "—"}
                    </td>
                    <td className="px-4 py-3"><RowActions id={it.id} title={it.titleRu} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
