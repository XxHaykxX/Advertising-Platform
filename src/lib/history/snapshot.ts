import "server-only";
import type { Prisma } from "@prisma/client";

// What a saved state of a content record looks like on disk (ContentVersion.snapshot).
//
// A Project snapshot carries its whole aggregate — cast, tiers, placements,
// milestones — because that is the unit a person edits and therefore the unit
// they expect "restore" to put back. Restoring a project without its cast would
// be a half-restore nobody asked for. An AdSpace is the same case: the form
// edits the space and its offers together, so the snapshot carries the offers.
//
// The other three entities are single rows and snapshot as-is.

export const HISTORY_ENTITIES = ["Project", "AdSpace", "Person", "Portfolio", "Testimonial", "Partner"] as const;
export type HistoryEntity = (typeof HISTORY_ENTITIES)[number];

export const HISTORY_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "RESTORE",
  "PUBLISH",
  "UNPUBLISH",
] as const;
export type HistoryAction = (typeof HISTORY_ACTIONS)[number];

/** Minimal Prisma surface these helpers need — satisfied by both `prisma` and a
 *  `$transaction` client, so a snapshot can be read inside the same transaction
 *  that is about to change the row. */
export type Db = Prisma.TransactionClient;

/** Columns excluded from every snapshot: derived counters that change without
 *  anyone editing anything. Restoring a view count would be wrong, and diffing
 *  it would make every version look changed. */
const VOLATILE_FIELDS = new Set(["viewCount", "updatedAt"]);

/** Read the full current state of one record, ready to be stored as a version.
 *  Returns null when the row is gone — the caller decides whether that is an
 *  error or simply nothing to record. */
export async function buildSnapshot(
  db: Db,
  entity: HistoryEntity,
  id: number,
): Promise<Record<string, unknown> | null> {
  if (entity === "Project") {
    const project = await db.project.findUnique({
      where: { id },
      include: {
        actors: { orderBy: { id: "asc" } },
        tiers: { orderBy: { id: "asc" } },
        placements: { orderBy: { id: "asc" } },
        milestones: { orderBy: { id: "asc" } },
      },
    });
    return project ? strip(project) : null;
  }

  if (entity === "AdSpace") {
    const space = await db.adSpace.findUnique({
      where: { id },
      include: { offers: { orderBy: { id: "asc" } } },
    });
    return space ? strip(space) : null;
  }

  if (entity === "Person") {
    const row = await db.person.findUnique({ where: { id } });
    return row ? strip(row) : null;
  }

  if (entity === "Portfolio") {
    const row = await db.portfolio.findUnique({ where: { id } });
    return row ? strip(row) : null;
  }

  if (entity === "Testimonial") {
    const row = await db.testimonial.findUnique({ where: { id } });
    return row ? strip(row) : null;
  }

  const row = await db.partner.findUnique({ where: { id } });
  return row ? strip(row) : null;
}

/** Drop volatile fields, recursively — nested rows get the same treatment. */
function strip(value: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (VOLATILE_FIELDS.has(key)) continue;
    out[key] = Array.isArray(v) ? v.map((item) => strip(item)) : v;
  }
  return out;
}

/** Every /uploads/… path mentioned anywhere in a snapshot, deduped.
 *
 *  Stored alongside the version so the media library can answer "which versions
 *  still point at this file?" with a substring match instead of parsing every
 *  snapshot it has. Catches paths inside JSON-encoded columns (gallery,
 *  references) too, since it scans the serialized form. */
export function collectMediaPaths(snapshot: Record<string, unknown>): string[] {
  const json = JSON.stringify(snapshot);
  const found = json.match(/\/uploads\/[A-Za-z0-9._\-/]+/g);
  return found ? [...new Set(found)] : [];
}
