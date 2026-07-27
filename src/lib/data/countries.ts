import "server-only";
import { prisma } from "@/lib/prisma";
import { COUNTRY_VALUES } from "@/lib/countries";

/**
 * Options for the project form's "Content Original Countries" multi-select.
 *
 * The dictionary is DB-backed (see prisma/schema.prisma's Country model) so an
 * editor can add a country that isn't listed and have it offered on every
 * future project — and delete one they don't want offered again.
 *
 * The built-in list in src/lib/countries.ts seeds the table (the same values
 * are inserted by the migration). It is used here ONLY when the table is still
 * empty — a fresh database, or the window before the migration runs — because
 * merging it in on every read would resurrect any built-in an admin deleted.
 */
export async function getCountryOptions(): Promise<string[]> {
  const rows = await prisma.country.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.length > 0 ? rows.map((c) => c.name) : COUNTRY_VALUES;
}
