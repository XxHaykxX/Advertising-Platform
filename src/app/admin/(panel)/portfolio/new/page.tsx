import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { createPortfolio } from "../actions";
import { PortfolioForm } from "../portfolio-form";

export default async function NewPortfolioPage() {
  await requireSuperadmin();
  const publishers = await prisma.user.findMany({
    where: { role: "PUBLISHER" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <Link href="/admin/portfolio" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to portfolio
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">New case</h1>
      <PortfolioForm action={createPortfolio} submitLabel="Create case" publishers={publishers} />
    </div>
  );
}
