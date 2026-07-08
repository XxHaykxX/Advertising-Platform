import "server-only";
import { prisma } from "@/lib/prisma";
import type { ApplicationDTO } from "@/lib/types";

export interface CreateApplicationInput {
  name: string;
  email?: string;
  company?: string;
  projectId?: number;
  projectTitle?: string;
  budget?: string;
  message?: string;
}

export async function createApplication(data: CreateApplicationInput) {
  return prisma.application.create({
    data: {
      name: data.name,
      email: data.email,
      company: data.company,
      projectId: data.projectId,
      projectTitle: data.projectTitle,
      budget: data.budget,
      message: data.message,
    },
  });
}

export async function listApplications(status?: string): Promise<ApplicationDTO[]> {
  const rows = await prisma.application.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return rows.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    company: a.company,
    projectId: a.projectId,
    projectTitle: a.projectTitle,
    budget: a.budget,
    message: a.message,
    status: a.status,
    note: a.note,
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function statusCounts(): Promise<{ new: number; in_progress: number; closed: number }> {
  const groups = await prisma.application.groupBy({
    by: ["status"],
    _count: { status: true },
  });
  const counts = { new: 0, in_progress: 0, closed: 0 };
  for (const g of groups) {
    if (g.status === "new") counts.new = g._count.status;
    else if (g.status === "in_progress") counts.in_progress = g._count.status;
    else if (g.status === "closed") counts.closed = g._count.status;
  }
  return counts;
}
