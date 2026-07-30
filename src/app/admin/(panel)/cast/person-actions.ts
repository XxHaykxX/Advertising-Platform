"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireContentEditor } from "@/lib/auth/require";
import type { PersonRow } from "@/lib/data/persons";
import { guessNameLocale } from "@/lib/person-name";
import { TranslateError, transliterateName, type TranslateErrorCode } from "@/lib/translate";

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
  return {
    id: person.id,
    name: person.name,
    nameHy: person.nameHy,
    nameRu: person.nameRu,
    nameEn: person.nameEn,
    role: person.role,
    kind: person.kind,
    photo: person.photo,
  };
}

export type PersonPatchInput = Partial<{
  nameHy: string;
  nameRu: string;
  nameEn: string;
  role: string;
  kind: string;
  photo: string | null;
}>;

/**
 * The legacy single-spelling `name` column is still the fallback everywhere
 * (pickPersonName, and the by-name Person lookup in resolveActorPersonIds), so
 * it is kept in step whenever a spelling changes: Armenian first — that is how
 * the directory was seeded and how the catalogue reads — then English, then
 * Russian. A row is never left with an empty base while a spelling exists.
 */
function withBaseName(patch: PersonPatchInput, current: { nameHy: string; nameRu: string; nameEn: string }) {
  const touchesName = "nameHy" in patch || "nameRu" in patch || "nameEn" in patch;
  if (!touchesName) return patch;
  const next = { ...current, ...patch };
  const base = (next.nameHy || next.nameEn || next.nameRu || "").trim();
  return { ...patch, name: base };
}

/**
 * Push the directory's spellings onto every project that credits this person.
 *
 * Actor rows are snapshots, refreshed when a project is saved — but nobody
 * re-saves twelve projects after fixing a typo in the directory, and until they
 * did the corrected name would be nowhere on the site. The directory is the
 * source of truth for how a person is spelled, so a rename propagates
 * immediately. Role/photo stay per-project (a credit differs by project); only
 * the name columns travel.
 */
async function syncActorNames(personId: number): Promise<void> {
  const person = await prisma.person.findUnique({
    where: { id: personId },
    select: { name: true, nameHy: true, nameRu: true, nameEn: true },
  });
  if (!person) return;
  const { count } = await prisma.actor.updateMany({
    where: { personId },
    data: { name: person.name, nameHy: person.nameHy, nameRu: person.nameRu, nameEn: person.nameEn },
  });
  // Project reads are cached under the "projects" tag (src/lib/data/projects.ts,
  // 300s) — without this the corrected name would sit in the DB unseen.
  if (count > 0) updateTag("projects");
}

export async function updatePerson(id: number, patch: PersonPatchInput): Promise<void> {
  await requireContentEditor();
  const current = await prisma.person.findUnique({
    where: { id },
    select: { nameHy: true, nameRu: true, nameEn: true },
  });
  if (!current) return;
  const data = withBaseName(patch, current);
  await prisma.person.update({ where: { id }, data });
  if ("name" in data) await syncActorNames(id);
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

export type SpellNameResult =
  | { ok: true; nameHy: string; nameRu: string; nameEn: string }
  // Short code the client turns into a message — never the raw provider error.
  | { ok: false; errorCode: TranslateErrorCode };

/**
 * Fill a person's three spellings from whichever one is already typed
 * (2026-07-27). Names are transliterated, not translated — see
 * transliterateName. Writes the result straight to the row so the editor's
 * usual autosave doesn't have to race with it, and returns it for the UI.
 *
 * Spellings the editor already has are NOT overwritten: a name someone typed
 * by hand outranks a model's guess.
 */
export async function spellPersonName(id: number): Promise<SpellNameResult> {
  await requireContentEditor();
  const person = await prisma.person.findUnique({
    where: { id },
    select: { name: true, nameHy: true, nameRu: true, nameEn: true },
  });
  if (!person) return { ok: false, errorCode: "genericError" };

  // Source = the first spelling that is filled in, in the order the directory
  // is actually maintained (Armenian first), falling back to the base column.
  const source =
    (person.nameHy && { text: person.nameHy, lang: "hy" as const }) ||
    (person.nameEn && { text: person.nameEn, lang: "en" as const }) ||
    (person.nameRu && { text: person.nameRu, lang: "ru" as const }) ||
    (person.name && { text: person.name, lang: guessNameLocale(person.name) }) ||
    null;
  if (!source) return { ok: false, errorCode: "emptyFields" };

  let spelled;
  try {
    spelled = await transliterateName(source.text, source.lang);
  } catch (e) {
    console.error("[spellPersonName]", e);
    return { ok: false, errorCode: e instanceof TranslateError ? e.code : "genericError" };
  }

  const merged = {
    nameHy: person.nameHy || spelled.hy,
    nameRu: person.nameRu || spelled.ru,
    nameEn: person.nameEn || spelled.en,
  };
  await prisma.person.update({
    where: { id },
    data: { ...merged, name: (merged.nameHy || merged.nameEn || merged.nameRu || "").trim() },
  });
  await syncActorNames(id);
  revalidatePath(CAST_PATH);
  return { ok: true, ...merged };
}
