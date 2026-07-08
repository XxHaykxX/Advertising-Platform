import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSuperadmin } from "@/lib/auth/require";
import { createPartner } from "../actions";
import { PartnerForm } from "../partner-form";

export default async function NewPartnerPage() {
  await requireSuperadmin();

  return (
    <div>
      <Link
        href="/admin/partners"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to partners
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">New partner</h1>
      <PartnerForm action={createPartner} submitLabel="Create partner" />
    </div>
  );
}
