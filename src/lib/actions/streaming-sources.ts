"use server";

import { prisma } from "@/lib/prisma";
import { loadCurrentUser, requireContentEditor } from "@/lib/auth/require";
import { canEditContent } from "@/lib/auth/permissions";

/** True for anyone allowed to author a project, and therefore to widen the
 *  streaming-source dictionary: staff content editors and self-serve members
 *  (a CREATOR submitting a project may type a platform we don't know yet).
 *  Returns a boolean instead of redirecting — see addStreamingSources. */
async function mayAuthorProjects(): Promise<boolean> {
  const user = await loadCurrentUser();
  if (!user) return false;
  if (canEditContent(user.role)) return true;
  return user.role === "CREATOR" || user.role === "BRAND";
}

/** Upsert any not-yet-known streaming-source names into the global dictionary
 *  (see prisma/schema.prisma's StreamingSource model) so a custom value typed
 *  into one project's Streaming Source MultiSelect is offered on every future
 *  project too. Blank/duplicate names are skipped; failures here must never
 *  block a project save — callers wrap this in try/catch.
 *
 *  Guarded by mayAuthorProjects() rather than a require*() helper on purpose:
 *  this used to be `requireUser()` (staff-only), which threw the redirect for
 *  every CREATOR submission — swallowed by the caller's try/catch, so a
 *  creator's custom platform silently never reached the dictionary. A plain
 *  no-op for anyone else keeps that failure mode impossible while still
 *  refusing anonymous callers. */
export async function addStreamingSources(names: string[]): Promise<void> {
  if (!(await mayAuthorProjects())) return;

  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (!unique.length) return;

  for (const name of unique) {
    await prisma.streamingSource.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

/** Remove a value from the global dictionary — it stops being offered as an
 *  option on every future project (already-saved projects keep their stored
 *  text value untouched). Missing name is treated as success.
 *
 *  Destructive and admin-only (the delete button lives in the project form),
 *  so this one keeps a hard content-editor gate: a MODERATOR or TRANSLATOR
 *  session must not be able to prune the dictionary by POSTing the action. */
export async function deleteStreamingSource(name: string): Promise<{ ok: boolean }> {
  await requireContentEditor();

  try {
    await prisma.streamingSource.delete({ where: { name } });
  } catch {
    // already gone — treat as success so the UI can prune it
  }
  return { ok: true };
}
