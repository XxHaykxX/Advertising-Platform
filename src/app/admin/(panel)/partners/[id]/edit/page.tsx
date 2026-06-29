import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { updatePartner } from "../../actions";
import { PartnerForm, type PartnerInitial } from "../../partner-form";

export default async function EditPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await prisma.partner.findUnique({ where: { id: Number(id) } });
  if (!p) notFound();

  const initial: PartnerInitial = {
    name: p.name,
    logo: p.logo ?? "",
    url: p.url ?? "",
    sortOrder: p.sortOrder,
  };

  return (
    <div>
      <Link href="/admin/partners" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to partners
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">Edit: {p.name}</h1>
      <PartnerForm action={updatePartner.bind(null, p.id)} initial={initial} submitLabel="Save" />
    </div>
  );
}
