import "server-only";
import { prisma } from "@/lib/prisma";
import { APP_STATUSES, type AppStatus } from "@/lib/constants";

export type Application = Awaited<
  ReturnType<typeof prisma.application.findMany>
>[number];

export function isAppStatus(v: string): v is AppStatus {
  return (APP_STATUSES as readonly string[]).includes(v);
}

export async function listApplications(status?: AppStatus) {
  return prisma.application.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function getApplication(id: number) {
  if (!Number.isFinite(id)) return null;
  return prisma.application.findUnique({ where: { id } });
}

export async function statusCounts(): Promise<Record<string, number>> {
  const rows = await prisma.application.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const out: Record<string, number> = { all: 0 };
  for (const r of rows) {
    out[r.status] = r._count._all;
    out.all += r._count._all;
  }
  return out;
}
