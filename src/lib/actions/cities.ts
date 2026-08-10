"use server";

import { prisma } from "@/lib/prisma";
import { loadCurrentUser, requireContentEditor } from "@/lib/auth/require";
import { canEditContent } from "@/lib/auth/permissions";

/* Global city dictionary behind the ad-space form's City picker (#64) — a
   direct mirror of src/lib/actions/countries.ts, including its authorization
   split, so all four dictionaries (StreamingSource/Country/Studio/City)
   behave the same. */

/** Who may WIDEN the dictionary: staff content editors only. A creator's
 *  custom entry stays on their own AdSpace row instead — see the same guard
 *  in src/lib/actions/countries.ts (owner decision 2026-08-07). Returns a
 *  boolean instead of redirecting — see addCities. */
async function mayEditDictionary(): Promise<boolean> {
  const user = await loadCurrentUser();
  return !!user && canEditContent(user.role);
}

/**
 * Upsert any not-yet-known city names into the dictionary so a value typed
 * into one ad space is offered on every future one too. Blank/duplicate names
 * are skipped; failures here must never block a save — callers wrap this in
 * try/catch.
 */
export async function addCities(names: string[]): Promise<void> {
  if (!(await mayEditDictionary())) return;

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (!unique.length) return;

  for (const name of unique) {
    await prisma.city.upsert({ where: { name }, update: {}, create: { name } });
  }
}

/**
 * Remove a city from the dictionary — it stops being offered on every future
 * ad space. Spaces that already store it keep their value untouched (the
 * column is still a plain string; deleting from the dictionary only narrows
 * the picker's option list).
 *
 * Destructive and staff-only: a MODERATOR or TRANSLATOR session must not be
 * able to prune the dictionary by POSTing the action.
 */
export async function deleteCity(name: string): Promise<{ ok: boolean }> {
  await requireContentEditor();

  try {
    await prisma.city.delete({ where: { name } });
  } catch {
    // already gone — treat as success so the UI can prune it
  }
  return { ok: true };
}
