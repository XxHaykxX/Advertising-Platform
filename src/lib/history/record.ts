import "server-only";
import { summarize } from "./diff";
import {
  buildSnapshot,
  collectMediaPaths,
  type Db,
  type HistoryAction,
  type HistoryEntity,
} from "./snapshot";

// Writing one version of a content record.
//
// Every call takes the transaction client of the save it belongs to, so the
// version and the change it describes land together or not at all. A version
// written outside the transaction could survive a rolled-back save and claim an
// edit that never happened.

export type Author = { id: number; name: string };

/** Record the state a record is in right now.
 *
 *  Call AFTER the change for CREATE / UPDATE / RESTORE / PUBLISH / UNPUBLISH,
 *  and BEFORE it for DELETE (there is nothing left to read afterwards).
 *
 *  Never throws: history is a safety net, and a net that can fail the save it
 *  protects is worse than no net. Failures are logged and swallowed. */
export async function recordVersion(
  db: Db,
  entity: HistoryEntity,
  entityId: number,
  action: HistoryAction,
  author: Author,
): Promise<void> {
  try {
    const snapshot = await buildSnapshot(db, entity, entityId);
    if (!snapshot) return; // row already gone — nothing truthful to record

    const previous = await db.contentVersion.findFirst({
      where: { entity, entityId },
      orderBy: { version: "desc" },
      select: { version: true, snapshot: true, action: true },
    });

    // A DELETE followed by a CREATE of the same id (restore) must not be diffed
    // against the deleted state — that would report every field as changed.
    const previousSnapshot =
      previous && previous.action !== "DELETE"
        ? (JSON.parse(previous.snapshot) as Record<string, unknown>)
        : null;

    const summary =
      action === "DELETE"
        ? "deleted"
        : action === "PUBLISH"
          ? "published"
          : action === "UNPUBLISH"
            ? "hidden from the catalog"
            : action === "RESTORE"
              ? "restored an earlier version"
              : // An edit to a record that predates the history feature has
                // nothing to diff against. Saying "created" there would be a
                // lie — the record already existed — so name what this row
                // actually is: the first state we ever captured.
                !previousSnapshot && action === "UPDATE"
                ? "first recorded state"
                : summarize(previousSnapshot, snapshot);

    const mediaPaths = collectMediaPaths(snapshot);

    await db.contentVersion.create({
      data: {
        entity,
        entityId,
        version: (previous?.version ?? 0) + 1,
        action,
        snapshot: JSON.stringify(snapshot),
        mediaPaths: mediaPaths.length ? mediaPaths.join("\n") : null,
        summary,
        authorId: author.id,
        authorName: author.name,
      },
    });
  } catch (e) {
    // Swallow: see the note above. Logged so it is still visible in prod logs.
    console.error(`[history] failed to record ${action} on ${entity}#${entityId}`, e);
  }
}
