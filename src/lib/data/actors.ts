import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActorDTO } from "@/lib/types";

export async function listActorsByProject(projectId: number): Promise<ActorDTO[]> {
  const rows = await prisma.actor.findMany({
    where: { projectId },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((a) => ({ id: a.id, name: a.name, role: a.role, kind: a.kind, photo: a.photo ?? "" }));
}
