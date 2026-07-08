import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { DeleteButton } from "./row-actions";

export default async function PortfolioAdminPage() {
  await requireSuperadmin();

  const items = await prisma.portfolio.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          <p className="mt-1 text-sm text-muted-foreground">{items.length} case studies</p>
        </div>
        <Link
          href="/admin/portfolio/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New case study
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">
          No case studies.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium">Sort</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="h-10 w-16 overflow-hidden rounded bg-muted">
                      {p.image && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.image} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/portfolio/${p.id}/edit`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.brand}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.sortOrder}</td>
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
