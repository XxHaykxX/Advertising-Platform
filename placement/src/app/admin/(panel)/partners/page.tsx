import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { DeleteButton } from "./row-actions";

export default async function PartnersAdminPage() {
  await requireSuperadmin();

  const partners = await prisma.partner.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Partners</h1>
          <p className="mt-1 text-sm text-muted-foreground">{partners.length} partners</p>
        </div>
        <Link
          href="/admin/partners/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New partner
        </Link>
      </div>

      {partners.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">
          No partners.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Logo</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">URL</th>
                <th className="px-4 py-3 font-medium">Sort</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="grid h-10 w-16 place-items-center overflow-hidden rounded bg-muted">
                      {p.logo && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.logo} alt="" className="h-full w-full object-contain" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/partners/${p.id}/edit`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">{p.url}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.sortOrder}</td>
                  <td className="px-4 py-3">
                    <DeleteButton id={p.id} name={p.name} />
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
