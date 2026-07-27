"use server";

import { prisma } from "@/lib/prisma";
import { loadCurrentUser, requireContentEditor } from "@/lib/auth/require";
import { canEditContent } from "@/lib/auth/permissions";

/* Global country dictionary behind the project form's "Content Original
   Countries" picker — a direct mirror of src/lib/actions/streaming-sources.ts,
   including its authorization split, so both dictionaries behave the same. */

/** Anyone allowed to author a project, and therefore to widen the dictionary:
 *  staff content editors and self-serve members (a CREATOR submitting a project
 *  may name a country we don't list yet). Returns a boolean instead of
 *  redirecting — see addCountries. */
async function mayAuthorProjects(): Promise<boolean> {
  const user = await loadCurrentUser();
  if (!user) return false;
  if (canEditContent(user.role)) return true;
  return user.role === "CREATOR" || user.role === "BRAND";
}

/**
 * Upsert any not-yet-known country names into the dictionary so a value typed
 * into one project is offered on every future project too. Blank/duplicate
 * names are skipped; failures here must never block a project save — callers
 * wrap this in try/catch.
 *
 * Guarded by a boolean check rather than a require*() helper for the same
 * reason as addStreamingSources: a redirect thrown inside a creator's submit
 * would be swallowed by that try/catch and the value would silently never
 * reach the dictionary.
 */
export async function addCountries(names: string[]): Promise<void> {
  if (!(await mayAuthorProjects())) return;

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (!unique.length) return;

  for (const name of unique) {
    await prisma.country.upsert({ where: { name }, update: {}, create: { name } });
  }
}

/**
 * Remove a country from the dictionary — it stops being offered on every future
 * project. Projects that already store it keep their value untouched (the
 * column is free text, and the picker still renders a stored value as a chip).
 *
 * Destructive and staff-only: a MODERATOR or TRANSLATOR session must not be
 * able to prune the dictionary by POSTing the action.
 */
export async function deleteCountry(name: string): Promise<{ ok: boolean }> {
  await requireContentEditor();

  try {
    await prisma.country.delete({ where: { name } });
  } catch {
    // already gone — treat as success so the UI can prune it
  }
  return { ok: true };
}
