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

/** A cast/crew person previously entered on ANY project — powers the Cast &
 *  Crew autocomplete (#11) so a returning person's role/kind/photo don't have
 *  to be retyped every time. */
export type PersonSuggestion = { name: string; role: string; kind: string; photo: string };

/** Distinct people across every project, deduped by name (case-insensitive).
 *  Newest row wins per name (orderBy id desc + first-occurrence dedupe), so
 *  the suggestion reflects how that person was most recently credited. Capped
 *  at 500 — plenty for a datalist, and keeps the query cheap as the table grows. */
export async function getKnownPeople(): Promise<PersonSuggestion[]> {
  const rows = await prisma.actor.findMany({
    orderBy: { id: "desc" },
    take: 2000,
    select: { name: true, role: true, kind: true, photo: true },
  });
  return dedupePeople(rows);
}

/** Dedupe cast/crew rows by case-insensitive trimmed name, first occurrence
 *  wins (callers pass rows newest-first so the most recent credit survives),
 *  blank names dropped, capped at 500. Pure — extracted from getKnownPeople so
 *  the dedupe rule is unit-testable without a DB. */
export function dedupePeople(
  rows: { name: string; role: string; kind: string; photo: string | null }[],
): PersonSuggestion[] {
  const byName = new Map<string, PersonSuggestion>();
  for (const r of rows) {
    const key = r.name.trim().toLowerCase();
    if (!key || byName.has(key)) continue;
    byName.set(key, { name: r.name, role: r.role, kind: r.kind, photo: r.photo ?? "" });
  }
  return Array.from(byName.values()).slice(0, 500);
}
