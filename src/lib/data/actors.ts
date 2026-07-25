import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActorDTO } from "@/lib/types";
import { parseRolesInput } from "@/app/admin/(panel)/projects/form-shared";

export async function listActorsByProject(projectId: number): Promise<ActorDTO[]> {
  const rows = await prisma.actor.findMany({
    where: { projectId },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    roles: parseRolesInput(a.roles, a.role),
    kind: a.kind,
    photo: a.photo ?? "",
  }));
}

/** A cast/crew person suggested to the Cast & Crew name picker. Historically
 *  sourced from distinct Actor rows (#11); now sourced from the Person
 *  directory (Ф3, getPersonDirectory below), whose rows carry a real `id` —
 *  optional here so the legacy Actor-derived getKnownPeople/dedupePeople path
 *  (below, kept for its unit tests) still satisfies the type without one. */
export type PersonSuggestion = { id?: number; name: string; role: string; kind: string; photo: string };

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

/** The global Person directory (Ф3, /admin/cast) as PersonSuggestion[] — the
 *  Cast & Crew name picker's data source. Unlike getKnownPeople above, every
 *  row here has a real, stable `id` (a Person row), so picking one links the
 *  project's Actor row to it (Actor.personId) instead of just copying text. */
export async function getPersonDirectory(): Promise<PersonSuggestion[]> {
  const rows = await prisma.person.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, name: true, role: true, kind: true, photo: true },
  });
  return rows.map((p) => ({ id: p.id, name: p.name, role: p.role, kind: p.kind, photo: p.photo ?? "" }));
}
