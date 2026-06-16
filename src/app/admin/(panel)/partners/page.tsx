import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { RowActions } from "./row-actions";

export default async function PartnersAdminPage() {
  const partners = await prisma.partner.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Партнёры</h1>
          <p className="mt-1 text-sm text-white/55">{partners.length} логотипов</p>
        </div>
        <Link href="/admin/partners/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-600">
          <Plus className="h-4 w-4" />
          Новый партнёр
        </Link>
      </div>

      {partners.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center text-white/50">Партнёров нет.</div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs uppercase tracking-wide text-white/45">
                <th className="px-4 py-3 font-medium">Лого</th>
                <th className="px-4 py-3 font-medium">Название</th>
                <th className="px-4 py-3 font-medium">Ссылка</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="grid h-10 w-16 place-items-center overflow-hidden rounded bg-white/5">
                      {p.logo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.logo} alt="" className="max-h-8 w-auto object-contain" />
                      ) : (
                        <span className="text-xs text-white/40">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/partners/${p.id}/edit`} className="font-medium text-foreground hover:text-primary">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/55">{p.url || "—"}</td>
                  <td className="px-4 py-3"><RowActions id={p.id} name={p.name} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
