"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireContentEditor } from "@/lib/auth/require";
import type { PersonRow } from "@/lib/data/persons";

const CAST_PATH = "/admin/cast";

/** Prepend a new empty row — sortOrder one below the current minimum so it
 *  always lands first regardless of what reorderPersons has settled on. */
export async function createPerson(): Promise<PersonRow> {
  await requireContentEditor();
  const min = await prisma.person.aggregate({ _min: { sortOrder: true } });
  const person = await prisma.person.create({
    data: { name: "", role: "", kind: "CAST", sortOrder: (min._min.sortOrder ?? 0) - 1 },
  });
  revalidatePath(CAST_PATH);
  return { id: person.id, name: person.name, role: person.role, kind: person.kind, photo: person.photo };
}

export async function updatePerson(
  id: number,
  patch: Partial<{ name: string; role: string; kind: string; photo: string | null }>,
): Promise<void> {
  await requireContentEditor();
  await prisma.person.update({ where: { id }, data: patch });
  revalidatePath(CAST_PATH);
}

export async function deletePerson(id: number): Promise<void> {
  await requireContentEditor();
  await prisma.person.delete({ where: { id } });
  revalidatePath(CAST_PATH);
}

/** Persists the full row order in one go — same pattern as reorderProjects. */
export async function reorderPersons(orderedIds: number[]): Promise<void> {
  await requireContentEditor();
  if (orderedIds.length === 0) return;
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.person.update({ where: { id }, data: { sortOrder: index } })),
  );
  revalidatePath(CAST_PATH);
}
