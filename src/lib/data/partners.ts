import "server-only";
import { prisma } from "@/lib/prisma";
import type { PartnerDTO } from "@/lib/types";

export async function getPartners(): Promise<PartnerDTO[]> {
  const rows = await prisma.partner.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    logo: p.logo,
    url: p.url || "#",
  }));
}
