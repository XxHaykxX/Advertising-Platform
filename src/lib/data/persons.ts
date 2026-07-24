import "server-only";
import { prisma } from "@/lib/prisma";

/** A globally-reusable cast/crew person (#9) — distinct from the per-project
 *  `Actor` rows in actors.ts: these live independently of any project and are
 *  managed from the admin Cast & Crew directory (/admin/cast). */
export type PersonRow = {
  id: number;
  name: string;
  role: string;
  kind: string;
  photo: string | null;
};

export async function getPersons(): Promise<PersonRow[]> {
  const rows = await prisma.person.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return rows.map((p) => ({ id: p.id, name: p.name, role: p.role, kind: p.kind, photo: p.photo }));
}
