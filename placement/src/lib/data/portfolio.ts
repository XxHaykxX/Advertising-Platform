import "server-only";
import { prisma } from "@/lib/prisma";
import type { PortfolioDTO } from "@/lib/types";

export async function getPortfolio(): Promise<PortfolioDTO[]> {
  const rows = await prisma.portfolio.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((c) => ({
    id: c.id,
    title: c.title,
    brand: c.brand,
    description: c.description,
    image: c.image,
    metrics: c.metrics ?? "{}",
  }));
}
