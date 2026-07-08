import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSuperadmin } from "@/lib/auth/require";
import { createPortfolio } from "../actions";
import { PortfolioForm } from "../portfolio-form";

export default async function NewPortfolioPage() {
  await requireSuperadmin();

  return (
    <div>
      <Link
        href="/admin/portfolio"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to portfolio
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">New case study</h1>
      <PortfolioForm action={createPortfolio} submitLabel="Create case study" />
    </div>
  );
}
