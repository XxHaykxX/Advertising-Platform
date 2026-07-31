import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { buildEntityHistoryGroups, getEntityHistory } from "@/app/admin/(panel)/history/lib";
import { EntityEditTabs } from "@/app/admin/(panel)/history/entity-edit-tabs";
import { EntityHistoryPanel } from "@/app/admin/(panel)/history/entity-history-panel";
import { updatePortfolio } from "../../actions";
import { PortfolioForm, type PortfolioFormInitial } from "../../portfolio-form";

export default async function EditPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperadmin();

  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  const p = await prisma.portfolio.findUnique({ where: { id: pid } });
  if (!p) notFound();

  const initial: PortfolioFormInitial = {
    title: p.title,
    description: p.description,
    brand: p.brand,
    image: p.image ?? "",
    metrics: p.metrics ?? "",
    titleHy: p.titleHy,
    titleRu: p.titleRu,
    titleEn: p.titleEn,
    descriptionHy: p.descriptionHy ?? "",
    descriptionRu: p.descriptionRu ?? "",
    descriptionEn: p.descriptionEn ?? "",
  };

  const action = updatePortfolio.bind(null, pid);

  // "History" tab (task #25) — this page is already SUPERADMIN-only, so the
  // restore buttons are always shown here.
  const historyGroups = buildEntityHistoryGroups(await getEntityHistory("Portfolio", pid));

  return (
    <div>
      <Link
        href="/admin/portfolio"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to portfolio
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">Edit: {p.title}</h1>

      <EntityEditTabs
        history={<EntityHistoryPanel entity="Portfolio" entityId={pid} groups={historyGroups} canRestore />}
      >
        <PortfolioForm action={action} initial={initial} submitLabel="Save" />
      </EntityEditTabs>
    </div>
  );
}
