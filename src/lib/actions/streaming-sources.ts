"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require";

/** Upsert any not-yet-known streaming-source names into the global dictionary
 *  (see prisma/schema.prisma's StreamingSource model) so a custom value typed
 *  into one project's Streaming Source MultiSelect is offered on every future
 *  project too. Blank/duplicate names are skipped; failures here must never
 *  block a project save — callers wrap this in try/catch. */
export async function addStreamingSources(names: string[]): Promise<void> {
  await requireUser();

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
 *  text value untouched). Missing name is treated as success. */
export async function deleteStreamingSource(name: string): Promise<{ ok: boolean }> {
  await requireUser();

  try {
    await prisma.streamingSource.delete({ where: { name } });
  } catch {
    // already gone — treat as success so the UI can prune it
  }
  return { ok: true };
}
