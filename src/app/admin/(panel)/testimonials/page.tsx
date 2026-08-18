import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { ReorderableTestimonialTable, type TestimonialRow } from "./reorder-list";

export default async function TestimonialsAdminPage() {
  await requireSuperadmin();

  const items = await prisma.testimonial.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });

  const rows: TestimonialRow[] = items.map((t) => ({
    id: t.id,
    image: t.image,
    authorName: t.authorName,
    company: t.company ?? "",
    locales: (["hy", "ru", "en"] as const).filter((l) => {
      const quote = l === "hy" ? t.quoteHy : l === "ru" ? t.quoteRu : t.quoteEn;
      return (quote || "").trim() !== "";
    }),
  }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Testimonials</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} testimonial{items.length === 1 ? "" : "s"}, shown on the homepage in this order
          </p>
        </div>
        <Link
          href="/admin/testimonials/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New testimonial
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground">
          No testimonials yet — add the first one.
        </div>
      ) : (
        <ReorderableTestimonialTable items={rows} />
      )}
    </div>
  );
}
