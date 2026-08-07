"use server";

import { prisma } from "@/lib/prisma";
import { loadCurrentUser, requireContentEditor } from "@/lib/auth/require";
import { canEditContent } from "@/lib/auth/permissions";

/** Who may WIDEN the streaming-source dictionary: staff content editors only.
 *  Members write the value onto their own Project row instead — see the same
 *  guard in src/lib/actions/studios.ts for the full reasoning (owner decision
 *  2026-08-07). Returns a boolean instead of redirecting — see
 *  addStreamingSources. */
async function mayEditDictionary(): Promise<boolean> {
  const user = await loadCurrentUser();
  return !!user && canEditContent(user.role);
}

/** Upsert any not-yet-known streaming-source names into the global dictionary
 *  (see prisma/schema.prisma's StreamingSource model) so a custom value typed
 *  into one project's Streaming Source MultiSelect is offered on every future
 *  project too. Blank/duplicate names are skipped; failures here must never
 *  block a project save — callers wrap this in try/catch.
 *
 *  Guarded by a boolean check rather than a require*() helper on purpose: a
 *  redirect thrown in here would be swallowed by the caller's try/catch and
 *  read as "saved fine". A plain no-op for anyone without the right keeps that
 *  failure mode impossible. */
export async function addStreamingSources(names: string[]): Promise<void> {
  if (!(await mayEditDictionary())) return;

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
