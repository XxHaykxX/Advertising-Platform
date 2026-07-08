import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { updatePartner } from "../../actions";
import { PartnerForm, type PartnerFormInitial } from "../../partner-form";

export default async function EditPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperadmin();

  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  const p = await prisma.partner.findUnique({ where: { id: pid } });
  if (!p) notFound();

  const initial: PartnerFormInitial = {
    name: p.name,
    logo: p.logo ?? "",
    url: p.url ?? "",
    sortOrder: p.sortOrder,
  };

  const action = updatePartner.bind(null, pid);

  return (
    <div>
      <Link
        href="/admin/partners"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to partners
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">Edit: {p.name}</h1>

      <PartnerForm action={action} initial={initial} submitLabel="Save" />
    </div>
  );
}
