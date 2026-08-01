import "server-only";
import { prisma } from "@/lib/prisma";
import { recordVersion, type Author } from "./record";
import type { Db, HistoryEntity } from "./snapshot";

// Putting an earlier state back.
//
// Two entry points, both SUPERADMIN-only (the caller gates; these functions
// assume that has already happened):
//   restoreToVersion — an existing record goes back to how it looked
//   restoreDeletedRecord — a deleted record comes back
//
// Both run in one transaction and record a RESTORE version of their own, so a
// restore is itself undoable.

type Snapshot = Record<string, unknown>;

/** Columns that must never be written back from a snapshot: identity and
 *  creation facts belong to the row, not to the version. */
const IMMUTABLE = new Set(["id", "createdAt"]);

/** Nested collections of a Project snapshot, in the order they are recreated. */
const PROJECT_CHILDREN = ["actors", "tiers", "placements", "milestones"] as const;

function scalarFields(snapshot: Snapshot): Snapshot {
  const out: Snapshot = {};
  for (const [k, v] of Object.entries(snapshot)) {
    if (IMMUTABLE.has(k)) continue;
    if (Array.isArray(v)) continue; // children are handled separately
    out[k] = v;
  }
  return out;
}

/** Dates come back from JSON as strings; Prisma wants Date objects. */
const DATE_FIELDS = new Set(["applicationDeadline", "releaseDate", "updatedAt"]);
function coerce(data: Snapshot): Snapshot {
  const out: Snapshot = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = DATE_FIELDS.has(k) && typeof v === "string" ? new Date(v) : v;
  }
  return out;
}

/** A Project snapshot taken before IA-42 (2026-08-01) has no
 *  applicationDeadlineOngoing / releasePrecision keys at all — restoring it
 *  onto a row that has since been marked Ongoing (or a non-DAY precision)
 *  would otherwise leave the two columns exactly as they are now, out of
 *  step with the date the restore is bringing back: the site would keep
 *  showing "Ongoing" over a project that has a concrete deadline again, and
 *  isArchived() short-circuits on that flag, so it would never leave the
 *  catalog either. Defaulted here to the pre-IA-42 behaviour (an exact date,
 *  never ongoing), then the same "ongoing implies no date" pairing every
 *  server action enforces on save is re-applied — a snapshot FROM after
 *  IA-42 can (rarely) carry an ongoing=true row with a stray applicationDeadline
 *  too, if it predates a since-fixed bug, so this isn't purely a legacy-data
 *  concern. Exported for the unit test; every other caller goes through
 *  restoreToVersion/restoreDeletedRecord. */
export function normalizeProjectRestore(data: Snapshot): Snapshot {
  const out: Snapshot = { ...data };
  if (out.applicationDeadlineOngoing === undefined) out.applicationDeadlineOngoing = false;
  if (out.releasePrecision === undefined) out.releasePrecision = "DAY";
  if (out.applicationDeadlineOngoing) out.applicationDeadline = null;
  return out;
}

/** Re-create the cast/tiers/placements/milestones a project snapshot carries.
 *
 *  A cast row points at the Person directory. If that person has since been
 *  deleted, the snapshot still holds their name and photo — so recreate the
 *  directory entry rather than dropping the link and losing the face. */
async function restoreProjectChildren(tx: Db, projectId: number, snapshot: Snapshot) {
  await tx.actor.deleteMany({ where: { projectId } });
  await tx.sponsorshipTier.deleteMany({ where: { projectId } });
  await tx.placement.deleteMany({ where: { projectId } });
  await tx.productionMilestone.deleteMany({ where: { projectId } });

  for (const key of PROJECT_CHILDREN) {
    const rows = (snapshot[key] as Snapshot[] | undefined) ?? [];
    for (const row of rows) {
      const data: Snapshot = { ...scalarFields(row), projectId };

      if (key === "actors" && typeof row.personId === "number") {
        const stillThere = await tx.person.findUnique({
          where: { id: row.personId },
          select: { id: true },
        });
        if (!stillThere) {
          const revived = await tx.person.create({
            data: {
              name: String(row.name ?? ""),
              nameHy: String(row.nameHy ?? ""),
              nameRu: String(row.nameRu ?? ""),
              nameEn: String(row.nameEn ?? ""),
              role: String(row.role ?? ""),
              kind: String(row.kind ?? "CAST"),
              photo: (row.photo as string | null) ?? null,
            },
          });
          data.personId = revived.id;
        }
      }

      if (key === "actors") await tx.actor.create({ data: data as never });
      else if (key === "tiers") await tx.sponsorshipTier.create({ data: data as never });
      else if (key === "placements") await tx.placement.create({ data: data as never });
      else await tx.productionMilestone.create({ data: data as never });
    }
  }
}

export type RestoreResult = { ok: true; entityId: number } | { ok: false; error: string };

/** Roll an existing record back to the state stored in one of its versions. */
export async function restoreToVersion(
  entity: HistoryEntity,
  entityId: number,
  version: number,
  author: Author,
): Promise<RestoreResult> {
  const row = await prisma.contentVersion.findUnique({
    where: { entity_entityId_version: { entity, entityId, version } },
    select: { snapshot: true, action: true },
  });
  if (!row) return { ok: false, error: "That version no longer exists." };
  if (row.action === "DELETE") {
    return { ok: false, error: "This version records a deletion — use Restore in the Deleted section instead." };
  }

  const snapshot = JSON.parse(row.snapshot) as Snapshot;

  try {
    await prisma.$transaction(
      async (tx) => {
        const data = coerce(scalarFields(snapshot));
        data.updatedById = author.id;

        if (entity === "Project") {
          await tx.project.update({ where: { id: entityId }, data: normalizeProjectRestore(data) as never });
          await restoreProjectChildren(tx, entityId, snapshot);
        } else if (entity === "Person") {
          await tx.person.update({ where: { id: entityId }, data: data as never });
        } else if (entity === "Portfolio") {
          await tx.portfolio.update({ where: { id: entityId }, data: data as never });
        } else {
          await tx.partner.update({ where: { id: entityId }, data: data as never });
        }

        await recordVersion(tx, entity, entityId, "RESTORE", author);
      },
      { timeout: 20000 },
    );
  } catch (e) {
    console.error(`[history] restore of ${entity}#${entityId} to v${version} failed`, e);
    return { ok: false, error: "Could not restore that version." };
  }

  return { ok: true, entityId };
}

/** Bring back a record whose latest version is a DELETE.
 *
 *  Reuses the original id when it is still free, so old links keep working. */
export async function restoreDeletedRecord(
  entity: HistoryEntity,
  entityId: number,
  author: Author,
): Promise<RestoreResult> {
  const latest = await prisma.contentVersion.findFirst({
    where: { entity, entityId },
    orderBy: { version: "desc" },
    select: { snapshot: true, action: true },
  });
  if (!latest) return { ok: false, error: "Nothing recorded for that record." };
  if (latest.action !== "DELETE") return { ok: false, error: "That record is not deleted." };

  const snapshot = JSON.parse(latest.snapshot) as Snapshot;
  const data = coerce(scalarFields(snapshot));
  data.id = entityId; // keep the original id; fails loudly if it was taken
  data.updatedById = author.id;

  let newId = entityId;
  try {
    await prisma.$transaction(
      async (tx) => {
        if (entity === "Project") {
          const created = await tx.project.create({ data: normalizeProjectRestore(data) as never });
          newId = created.id;
          await restoreProjectChildren(tx, newId, snapshot);
        } else if (entity === "Person") {
          newId = (await tx.person.create({ data: data as never })).id;
        } else if (entity === "Portfolio") {
          newId = (await tx.portfolio.create({ data: data as never })).id;
        } else {
          newId = (await tx.partner.create({ data: data as never })).id;
        }

        await recordVersion(tx, entity, newId, "RESTORE", author);
      },
      { timeout: 20000 },
    );
  } catch (e) {
    console.error(`[history] restore of deleted ${entity}#${entityId} failed`, e);
    return { ok: false, error: "Could not bring that record back." };
  }

  return { ok: true, entityId: newId };
}
