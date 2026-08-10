import "server-only";
import { prisma } from "@/lib/prisma";
import { CITY_VALUES } from "@/lib/cities";

/**
 * Options for the ad-space form's City picker (#64).
 *
 * DB-backed (see prisma/schema.prisma's City model) so staff can name a city
 * that isn't listed and have it offered on every future ad space — and delete
 * one they don't want offered again. Same contract as getCountryOptions.
 *
 * The built-in list in src/lib/cities.ts seeds the table (the same values are
 * inserted by the migration). It is used here ONLY when the table is still
 * empty — a fresh database, or the window before the migration runs — because
 * merging it in on every read would resurrect any built-in an admin deleted.
 */
export async function getCityOptions(): Promise<string[]> {
  const rows = await prisma.city.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.length > 0 ? rows.map((c) => c.name) : CITY_VALUES;
}
