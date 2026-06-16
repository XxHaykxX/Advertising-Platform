import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createPortfolio } from "../actions";
import { PortfolioForm } from "../portfolio-form";

export default function NewPortfolioPage() {
  return (
    <div>
      <Link href="/admin/portfolio" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        К портфолио
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-foreground">Новый кейс</h1>
      <PortfolioForm action={createPortfolio} submitLabel="Создать кейс" />
    </div>
  );
}
