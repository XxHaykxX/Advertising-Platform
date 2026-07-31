import Link from "next/link";
import { Trash2 } from "lucide-react";
import { requireStaffExceptTranslator } from "@/lib/auth/require";
import { ENTITY_TYPE_LABEL, entityLabel, formatDateOnly, formatTime, getDeletedEntities, parseSnapshot } from "../lib";
import { RestoreDeletedButton } from "../restore-buttons";

/* /admin/history/deleted — the trash bin half of task #25. Lists every
   record whose most recent ContentVersion is a DELETE (see
   getDeletedEntities in ../lib.ts); once #24 wires up restoreDeleted, a
   restored record simply stops showing up here (its newest version becomes
   RESTORE, not DELETE) — no extra bookkeeping needed on this page. */

export default async function DeletedHistoryPage() {
  const user = await requireStaffExceptTranslator();
  const canRestore = user.role === "SUPERADMIN";

  const rows = await getDeletedEntities();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deleted items</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Records whose last save was a deletion. Restoring recreates them from that last known state.
          </p>
        </div>
        <Link href="/admin/history" className="text-sm text-muted-foreground hover:text-primary">
          Back to history
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">
          <Trash2 className="h-8 w-8 text-muted-foreground/50" />
          Nothing in the trash.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Deleted by</th>
                <th className="px-4 py-3 font-medium">Deleted on</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const snapshot = parseSnapshot(row.snapshot);
                const label = entityLabel(row.entity, snapshot);
                return (
                  <tr key={row.id} className="border-b border-border align-top last:border-b-0 hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {ENTITY_TYPE_LABEL[row.entity] ?? row.entity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{label}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.authorName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateOnly(row.createdAt)}, {formatTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {canRestore ? <RestoreDeletedButton entity={row.entity} entityId={row.entityId} /> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
