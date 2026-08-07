"use server";

import { prisma } from "@/lib/prisma";
import { loadCurrentUser, requireContentEditor } from "@/lib/auth/require";
import { canEditContent } from "@/lib/auth/permissions";

/* Global studio dictionary behind the project form's "Studio name" picker — a
   direct mirror of src/lib/actions/countries.ts, including its authorization
   split, so all three dictionaries (streaming sources, countries, studios)
   behave the same. */

/** Who may WIDEN the dictionary: staff content editors only.
 *
 *  Members used to be allowed too, on the theory that a creator naming a
 *  production company we don't list yet should not be blocked. They still
 *  aren't: the value they type is stored on their own Project row (free text)
 *  and renders everywhere, exactly like the `cinemas` field which never had a
 *  dictionary at all. What changed on 2026-08-07 (owner decision) is that one
 *  creator's spelling — "Армения" vs "армения" vs "Armenia" — no longer becomes
 *  a permanent global option for everyone else. Staff promote it during
 *  moderation if it deserves promoting.
 *
 *  Returns a boolean instead of redirecting — see addStudios. */
async function mayEditDictionary(): Promise<boolean> {
  const user = await loadCurrentUser();
  return !!user && canEditContent(user.role);
}

/**
 * Upsert any not-yet-known studio names into the dictionary so a value typed
 * into one project is offered on every future project too. Blank/duplicate
 * names are skipped; failures here must never block a project save — callers
 * wrap this in try/catch.
 *
 * Guarded by a boolean check rather than a require*() helper for the same
 * reason as addCountries: a redirect thrown inside a creator's submit would be
 * swallowed by that try/catch and the value would silently never reach the
 * dictionary.
 */
export async function addStudios(names: string[]): Promise<void> {
  if (!(await mayEditDictionary())) return;

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (!unique.length) return;

  for (const name of unique) {
    await prisma.studio.upsert({ where: { name }, update: {}, create: { name } });
  }
}

/**
 * Remove a studio from the dictionary — it stops being offered on every future
 * project. Projects that already store it keep their value untouched (the
 * column is free text, and the picker still renders a stored value as a chip).
 *
 * Destructive and staff-only: a MODERATOR or TRANSLATOR session must not be
 * able to prune the dictionary by POSTing the action.
 */
export async function deleteStudio(name: string): Promise<{ ok: boolean }> {
  await requireContentEditor();

  try {
    await prisma.studio.delete({ where: { name } });
  } catch {
    // already gone — treat as success so the UI can prune it
  }
  return { ok: true };
}
