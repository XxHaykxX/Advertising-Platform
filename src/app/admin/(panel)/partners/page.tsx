import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { ReorderablePartnersTable, type PartnerRow } from "./reorder-list";

export default async function PartnersAdminPage() {
  await requireSuperadmin();

  const partners = await prisma.partner.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  const rows: PartnerRow[] = partners.map((p) => ({
    id: p.id,
    name: p.name,
    logo: p.logo,
    url: p.url,
  }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Partners</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {partners.length} {partners.length === 1 ? "partner" : "partners"}, shown on the site in
            this order
          </p>
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
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground">
          No partners yet — add the first one.
        </div>
      ) : (
        <ReorderablePartnersTable partners={rows} />
      )}
    </div>
  );
}
