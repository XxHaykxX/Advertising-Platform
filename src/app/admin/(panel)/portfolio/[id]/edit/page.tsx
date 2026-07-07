import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { updatePortfolio } from "../../actions";
import { PortfolioForm, type PortfolioInitial } from "../../portfolio-form";

function parseArr(s: string): string[] {
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a.map(String) : [];
  } catch {
    return [];
  }
}

export default async function EditPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperadmin();
  const { id } = await params;
  const it = await prisma.portfolio.findUnique({ where: { id: Number(id) } });
  if (!it) notFound();

  const publishers = await prisma.user.findMany({
    where: { role: "PUBLISHER" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const initial: PortfolioInitial = {
    titleRu: it.titleRu, titleEn: it.titleEn, titleHy: it.titleHy,
    descriptionRu: it.descriptionRu, descriptionEn: it.descriptionEn, descriptionHy: it.descriptionHy,
    images: parseArr(it.images),
    videoType: it.videoType,
    videoUrl: it.videoUrl ?? "",
    videoFile: it.videoFile ?? "",
    sortOrder: it.sortOrder,
    publisherId: it.publisherId,
  };

  return (
    <div>
      <Link href="/admin/portfolio" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to portfolio
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">Edit: {it.titleRu}</h1>
      <PortfolioForm action={updatePortfolio.bind(null, it.id)} initial={initial} submitLabel="Save" publishers={publishers} />
    </div>
  );
}
