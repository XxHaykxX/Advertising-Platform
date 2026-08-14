"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireSuperadmin } from "@/lib/auth/require";
import { restoreDeletedRecord, restoreToVersion } from "@/lib/history/restore";
import { revalidateAdSpaces } from "@/lib/data/revalidate-ad-spaces";
import { isHistoryEntity } from "./lib";

// The rollback/restore core (snapshot -> live rows, nested cast/tiers/
// placements/milestones, the new RESTORE version) is task #24's work, in
// src/lib/history/restore.ts. This file is the thin Server Action layer over
// it: auth re-check, cache invalidation, and the {ok, redirect?} shape every
// action in this app returns — never redirect() itself, which breaks
// chunk-loading on prod (AGENTS.md).

export type HistoryActionResult = { ok: true; redirect?: string } | { ok: false; error: string };

/** Cache/page invalidation after a restore. Mirrors revalidateProjectPaths in
 *  admin/projects/actions.ts (that helper is private to that file, hence this
 *  copy) — only Project and AdSpace reads go through unstable_cache (the
 *  "projects" and "ad-spaces" tags in lib/data/); Person, Portfolio and Partner
 *  are plain per-request reads, so revalidating their pages is enough. */
function revalidateAfterRestore(entity: string, entityId: number) {
  switch (entity) {
    case "Project":
      updateTag("projects");
      revalidatePath("/admin/projects");
      revalidatePath(`/reports/${entityId}`);
      // /ads renders its own cached list (the former /catalog merged into it
      // 2026-08-14); without this a restored title keeps showing the damaged
      // one to visitors for up to five minutes.
      revalidatePath("/ads");
      break;
    case "AdSpace":
      // updateTag("ad-spaces") + the whole /ads route tree — the same helper
      // every ad-space save/approval calls, for the same reason.
      revalidateAdSpaces();
      revalidatePath("/admin/ad-spaces");
      revalidatePath("/account/ad-spaces");
      break;
    case "Person":
      revalidatePath("/admin/cast");
      break;
    case "Portfolio":
      revalidatePath("/admin/portfolio");
      revalidatePath("/portfolio");
      break;
    case "Partner":
      revalidatePath("/admin/partners");
      revalidatePath("/");
      break;
  }
}

/** Roll one record back to an earlier version. SUPERADMIN only — the button
 *  that calls this is already hidden from everyone else in the UI; this
 *  re-checks it, since a Server Action is reachable by direct POST too. */
export async function restoreVersion(
  entity: string,
  entityId: number,
  version: number,
): Promise<HistoryActionResult> {
  const user = await requireSuperadmin();
  if (!isHistoryEntity(entity)) return { ok: false, error: "Unknown record type." };

  const result = await restoreToVersion(entity, entityId, version, { id: user.id, name: user.name });
  if (!result.ok) return { ok: false, error: result.error };

  revalidateAfterRestore(entity, result.entityId);
  return { ok: true };
}

/** Recreate a record from the last state it had before it was deleted.
 *  SUPERADMIN only, same re-check as restoreVersion. */
export async function restoreDeleted(entity: string, entityId: number): Promise<HistoryActionResult> {
  const user = await requireSuperadmin();
  if (!isHistoryEntity(entity)) return { ok: false, error: "Unknown record type." };

  const result = await restoreDeletedRecord(entity, entityId, { id: user.id, name: user.name });
  if (!result.ok) return { ok: false, error: result.error };

  revalidateAfterRestore(entity, result.entityId);
  return { ok: true };
}
