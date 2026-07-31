"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { RestoreVersionButton } from "./restore-buttons";

export type GroupVersionView = {
  id: number;
  version: number;
  action: string;
  actionLabel: string;
  actionPill: string;
  summary: string;
  time: string;
};

export type HistoryGroupRowProps = {
  entity: string;
  entityId: number;
  entityTypeLabel: string;
  recordLabel: string;
  recordHref: string;
  authorName: string;
  headerTime: string;
  mergedSummary: string;
  versions: GroupVersionView[]; // newest first, length >= 1
  canRestore: boolean;
};

/** One row of the /admin/history feed. A single save renders as one plain
 *  row; a burst of edits already collapsed server-side (see groupVersions in
 *  ./lib.ts) renders as one summary row that expands into its individual
 *  versions, each restorable on its own — the collapsing is display-only. */
export function HistoryGroupRow({
  entity,
  entityId,
  entityTypeLabel,
  recordLabel,
  recordHref,
  authorName,
  headerTime,
  mergedSummary,
  versions,
  canRestore,
}: HistoryGroupRowProps) {
  const [expanded, setExpanded] = useState(false);
  const grouped = versions.length > 1;
  const top = versions[0];

  return (
    <>
      <tr className="border-b border-border align-top last:border-b-0 hover:bg-muted/50">
        <td className="px-4 py-3 text-muted-foreground">
          {grouped ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 whitespace-nowrap text-left hover:text-primary"
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              {headerTime}
            </button>
          ) : (
            <span className="whitespace-nowrap">{headerTime}</span>
          )}
        </td>
        <td className="px-4 py-3 text-foreground">{authorName}</td>
        <td className="px-4 py-3">
          <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {entityTypeLabel}
          </span>
        </td>
        <td className="px-4 py-3">
          <Link href={recordHref} className="font-medium text-foreground hover:text-primary">
            {recordLabel}
          </Link>
        </td>
        <td className="px-4 py-3">
          {grouped ? (
            <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {versions.length} edits
            </span>
          ) : (
            <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${top.actionPill}`}>{top.actionLabel}</span>
          )}
        </td>
        <td className="px-4 py-3 text-muted-foreground">{grouped ? mergedSummary : top.summary}</td>
        <td className="px-4 py-3">
          {!grouped && canRestore && top.action !== "DELETE" ? (
            <RestoreVersionButton entity={entity} entityId={entityId} version={top.version} />
          ) : null}
        </td>
      </tr>
      {grouped && expanded
        ? versions.map((v) => (
            <tr key={v.id} className="border-b border-border bg-muted/20 align-top last:border-b-0">
              <td className="px-4 py-2.5 pl-9 text-xs text-muted-foreground">{v.time}</td>
              <td className="px-4 py-2.5" colSpan={2} />
              <td className="px-4 py-2.5" />
              <td className="px-4 py-2.5">
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${v.actionPill}`}>{v.actionLabel}</span>
              </td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{v.summary}</td>
              <td className="px-4 py-2.5">
                {canRestore && v.action !== "DELETE" ? (
                  <RestoreVersionButton entity={entity} entityId={entityId} version={v.version} />
                ) : null}
              </td>
            </tr>
          ))
        : null}
    </>
  );
}
