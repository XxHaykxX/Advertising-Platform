import Link from "next/link";
import { History as HistoryIcon } from "lucide-react";
import { requireStaffExceptTranslator } from "@/lib/auth/require";
import {
  ACTION_LABEL,
  ACTION_PILL,
  ENTITY_TYPE_LABEL,
  HISTORY_ENTITIES,
  entityHref,
  entityLabel,
  formatDateOnly,
  formatTime,
  getHistoryAuthors,
  getHistoryPage,
  groupVersions,
  isHistoryEntity,
  mergeFieldSummaries,
  parseSnapshot,
  type HistoryFilters,
} from "./lib";
import { HistoryGroupRow, type HistoryGroupRowProps } from "./group-row";

/* /admin/history — task #25 of the content-history feature (see AGENTS.md
   for the wider project; docs/INDEX.md for the doc map). Answers "what
   changed on the site, by whom, when": every ContentVersion row, newest
   first, grouped for display when one author saves the same record several
   times within a few minutes (see groupVersions in ./lib.ts).

   Rollback/restore actions are stubbed in ./actions.ts (task #24 fills them
   in); this page only renders the buttons and wires them up. */

function toInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; author?: string; from?: string; to?: string; page?: string }>;
}) {
  // Every staff role except TRANSLATOR — see admin-nav.tsx, which hides the
  // link for the same role for the same reason (its only page is /admin/i18n).
  const user = await requireStaffExceptTranslator();
  const canRestore = user.role === "SUPERADMIN";

  const sp = await searchParams;
  const filters: HistoryFilters = {
    entity: isHistoryEntity(sp.entity) ? sp.entity : undefined,
    authorId: toInt(sp.author),
    from: sp.from || undefined,
    to: sp.to || undefined,
  };
  const page = toInt(sp.page) ?? 1;

  const [{ rows, total, pageCount }, authors] = await Promise.all([
    getHistoryPage(filters, page),
    getHistoryAuthors(),
  ]);

  const groups = groupVersions(rows);

  const rowProps: HistoryGroupRowProps[] = groups.map((group) => {
    const newest = group.versions[0];
    const oldest = group.versions[group.versions.length - 1];
    const snapshot = parseSnapshot(newest.snapshot);

    return {
      entity: group.entity,
      entityId: group.entityId,
      entityTypeLabel: ENTITY_TYPE_LABEL[group.entity] ?? group.entity,
      recordLabel: entityLabel(group.entity, snapshot),
      recordHref: entityHref(group.entity, group.entityId),
      authorName: group.authorName,
      headerTime:
        group.versions.length > 1
          ? `${formatDateOnly(oldest.createdAt)}, ${formatTime(oldest.createdAt)}–${formatTime(newest.createdAt)}`
          : `${formatDateOnly(newest.createdAt)}, ${formatTime(newest.createdAt)}`,
      mergedSummary: mergeFieldSummaries(group.versions),
      versions: group.versions.map((v) => ({
        id: v.id,
        version: v.version,
        action: v.action,
        actionLabel: ACTION_LABEL[v.action] ?? v.action,
        actionPill: ACTION_PILL[v.action] ?? ACTION_PILL.UPDATE,
        summary: v.summary ?? "",
        time: `${formatDateOnly(v.createdAt)}, ${formatTime(v.createdAt)}`,
      })),
      canRestore,
    };
  });

  // Preserved across pagination links and shown next to "Clear filters".
  const baseParams = new URLSearchParams();
  if (filters.entity) baseParams.set("entity", filters.entity);
  if (filters.authorId) baseParams.set("author", String(filters.authorId));
  if (filters.from) baseParams.set("from", filters.from);
  if (filters.to) baseParams.set("to", filters.to);
  const hasFilters = baseParams.size > 0;

  function pageHref(p: number): string {
    const params = new URLSearchParams(baseParams);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/history?${qs}` : "/admin/history";
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every save across projects, cast &amp; crew, portfolio and partners — who changed what, and when.
          </p>
        </div>
        <Link
          href="/admin/history/deleted"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          Deleted items
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="hist-entity" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Type
          </label>
          <select
            id="hist-entity"
            name="entity"
            defaultValue={filters.entity ?? ""}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">All types</option>
            {HISTORY_ENTITIES.map((e) => (
              <option key={e} value={e}>
                {ENTITY_TYPE_LABEL[e]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="hist-author" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Author
          </label>
          <select
            id="hist-author"
            name="author"
            defaultValue={filters.authorId ? String(filters.authorId) : ""}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">All authors</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="hist-from" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            From
          </label>
          <input
            id="hist-from"
            type="date"
            name="from"
            defaultValue={filters.from ?? ""}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="hist-to" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            To
          </label>
          <input
            id="hist-to"
            type="date"
            name="to"
            defaultValue={filters.to ?? ""}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          Apply
        </button>
        {hasFilters ? (
          <Link href="/admin/history" className="text-sm text-muted-foreground hover:text-primary">
            Clear filters
          </Link>
        ) : null}
      </form>

      {rowProps.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">
          <HistoryIcon className="h-8 w-8 text-muted-foreground/50" />
          {hasFilters ? "No changes match these filters." : "No changes yet."}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Author</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Record</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Changed</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rowProps.map((r) => (
                <HistoryGroupRow key={`${r.entity}:${r.entityId}:${r.versions[0].id}`} {...r} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            Page {page} of {pageCount} · {total} version{total === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="rounded-lg border border-border px-3 py-1.5 hover:border-primary/40 hover:text-primary"
              >
                Previous
              </Link>
            ) : null}
            {page < pageCount ? (
              <Link
                href={pageHref(page + 1)}
                className="rounded-lg border border-border px-3 py-1.5 hover:border-primary/40 hover:text-primary"
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
