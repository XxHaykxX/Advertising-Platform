import "server-only";
import { prisma } from "@/lib/prisma";
import { STUDIO_VALUES } from "@/lib/studios";

/**
 * Options for the project form's "Studio name" multi-select.
 *
 * DB-backed (see prisma/schema.prisma's Studio model) so an editor can name a
 * production company that isn't listed and have it offered on every future
 * project — and delete one they don't want offered again. Same contract as
 * getCountryOptions.
 *
 * The built-in list in src/lib/studios.ts seeds the table (the same values are
 * inserted by the migration). It is used here ONLY when the table is still
 * empty — a fresh database, or the window before the migration runs — because
 * merging it in on every read would resurrect any built-in an admin deleted.
 */
export async function getStudioOptions(): Promise<string[]> {
  const rows = await prisma.studio.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.length > 0 ? rows.map((s) => s.name) : STUDIO_VALUES;
}
