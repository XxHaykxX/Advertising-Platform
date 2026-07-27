import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { parseMetrics } from "@/components/portfolio-page/metrics";
import { ReorderablePortfolioTable, type PortfolioRow } from "./reorder-list";

export default async function PortfolioAdminPage() {
  await requireSuperadmin();

  const items = await prisma.portfolio.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });

  const rows: PortfolioRow[] = items.map((p) => ({
    id: p.id,
    image: p.image,
    // The admin panel is English-only, so prefer the English spelling and fall
    // back the same way the public page does.
    title: p.titleEn || p.titleRu || p.titleHy || p.title,
    brand: p.brand,
    locales: (["hy", "ru", "en"] as const).filter((l) => {
      const title = l === "hy" ? p.titleHy : l === "ru" ? p.titleRu : p.titleEn;
      const desc = l === "hy" ? p.descriptionHy : l === "ru" ? p.descriptionRu : p.descriptionEn;
      return (title || "").trim() !== "" || (desc || "").trim() !== "";
    }),
    metricCount: Object.keys(parseMetrics(p.metrics ?? "{}")).length,
  }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} case {items.length === 1 ? "study" : "studies"}, shown on the site in this
            order
          </p>
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
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground">
          No case studies yet — add the first one.
        </div>
      ) : (
        <ReorderablePortfolioTable items={rows} />
      )}
    </div>
  );
}
