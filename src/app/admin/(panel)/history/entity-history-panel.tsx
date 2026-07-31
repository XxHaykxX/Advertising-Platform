"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, History as HistoryIcon } from "lucide-react";
import { RestoreVersionButton } from "./restore-buttons";
import type { GroupVersionView } from "./group-row";

export type EntityHistoryGroupView = {
  authorName: string;
  headerTime: string;
  mergedSummary: string;
  versions: GroupVersionView[]; // newest first, length >= 1
};

/** The "History" tab content for one record's own edit page — the same
 *  groupVersions() collapsing as the /admin/history feed, just scoped to a
 *  single entity+entityId and rendered as a card list instead of a table (no
 *  Type/Record columns needed when the record is already the page you're
 *  on). Data is computed server-side (see the three [id]/edit/page.tsx call
 *  sites) and handed down as plain props. */
export function EntityHistoryPanel({
  entity,
  entityId,
  groups,
  canRestore,
}: {
  entity: string;
  entityId: number;
  groups: EntityHistoryGroupView[];
  canRestore: boolean;
}) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-12 text-center text-muted-foreground">
        <HistoryIcon className="h-7 w-7 text-muted-foreground/50" />
        No changes recorded yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, i) => (
        // Index key is fine here: this list is server-rendered fresh on every
        // load (no client-side reordering/insertion that would need stable ids).
        <EntityHistoryGroupCard key={i} entity={entity} entityId={entityId} group={group} canRestore={canRestore} />
      ))}
    </div>
  );
}

function EntityHistoryGroupCard({
  entity,
  entityId,
  group,
  canRestore,
}: {
  entity: string;
  entityId: number;
  group: EntityHistoryGroupView;
  canRestore: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const grouped = group.versions.length > 1;
  const top = group.versions[0];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {grouped ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {group.headerTime}
            </button>
          ) : (
            <p className="text-sm font-medium text-foreground">{group.headerTime}</p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {group.authorName}
            {grouped ? ` · ${group.versions.length} edits` : ""}
          </p>
        </div>
        {!grouped ? (
          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${top.actionPill}`}>{top.actionLabel}</span>
        ) : null}
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{grouped ? group.mergedSummary : top.summary}</p>

      {!grouped && canRestore && top.action !== "DELETE" ? (
        <div className="mt-3">
          <RestoreVersionButton entity={entity} entityId={entityId} version={top.version} />
        </div>
      ) : null}

      {grouped && expanded ? (
        <ul className="mt-3 flex flex-col gap-2 border-l border-border pl-3">
          {group.versions.map((v) => (
            <li key={v.id} className="text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{v.time}</span>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${v.actionPill}`}>{v.actionLabel}</span>
              </div>
              <p className="mt-0.5">{v.summary}</p>
              {canRestore && v.action !== "DELETE" ? (
                <div className="mt-1.5">
                  <RestoreVersionButton entity={entity} entityId={entityId} version={v.version} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
