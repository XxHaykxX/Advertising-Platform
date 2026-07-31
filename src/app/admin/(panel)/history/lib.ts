import "server-only";
import { prisma } from "@/lib/prisma";
import type { ContentVersion, Prisma } from "@prisma/client";
import { HISTORY_ENTITIES, type HistoryEntity } from "@/lib/history/snapshot";

export { HISTORY_ENTITIES };
export type { HistoryEntity };

/** Rows per page of the /admin/history feed — the table this reads from
 *  grows without bound (every save writes a row), so the feed is paginated
 *  rather than loaded whole. */
export const PAGE_SIZE = 30;

// Consecutive edits by the same author on the same record collapse into one
// display row when the gap to the previous edit in the run is at most this
// long (spec: 15 minutes). Display-only — every ContentVersion row still
// exists on its own and is individually restorable.
const GROUP_WINDOW_MS = 15 * 60 * 1000;

export function isHistoryEntity(value: string | undefined): value is HistoryEntity {
  return !!value && (HISTORY_ENTITIES as readonly string[]).includes(value);
}

export type HistoryFilters = {
  entity?: HistoryEntity;
  authorId?: number;
  from?: string; // yyyy-mm-dd, inclusive
  to?: string; // yyyy-mm-dd, inclusive
};

function dateRange(filters: HistoryFilters): { gte?: Date; lte?: Date } | undefined {
  if (!filters.from && !filters.to) return undefined;
  const range: { gte?: Date; lte?: Date } = {};
  if (filters.from) range.gte = new Date(`${filters.from}T00:00:00`);
  if (filters.to) range.lte = new Date(`${filters.to}T23:59:59.999`);
  return range;
}

function whereFromFilters(filters: HistoryFilters): Prisma.ContentVersionWhereInput {
  const range = dateRange(filters);
  return {
    ...(filters.entity ? { entity: filters.entity } : {}),
    ...(filters.authorId ? { authorId: filters.authorId } : {}),
    ...(range ? { createdAt: range } : {}),
  };
}

/** One page of the history feed, newest first, plus enough to paginate. */
export async function getHistoryPage(
  filters: HistoryFilters,
  page: number,
): Promise<{ rows: ContentVersion[]; total: number; page: number; pageCount: number }> {
  const where = whereFromFilters(filters);
  const safePage = Math.max(1, page);

  const [rows, total] = await Promise.all([
    prisma.contentVersion.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.contentVersion.count({ where }),
  ]);

  return { rows, total, page: safePage, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Staff for the author filter dropdown — the full roster, not just names
 *  seen in ContentVersion so far, so the list doesn't shuffle as history
 *  grows. */
export async function getHistoryAuthors(): Promise<{ id: number; name: string }[]> {
  return prisma.user.findMany({
    where: { role: { in: ["SUPERADMIN", "PUBLISHER", "MODERATOR", "TRANSLATOR"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** Every version of one record, newest first — feeds the "History" tab
 *  embedded in that record's own edit page (Project/Portfolio/Partner; Person
 *  has no dedicated page, see entityHref). Capped the same defensive way as
 *  getDeletedEntities: one record's own history is expected to stay well
 *  under this in practice. */
export async function getEntityHistory(entity: HistoryEntity, entityId: number): Promise<ContentVersion[]> {
  return prisma.contentVersion.findMany({
    where: { entity, entityId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 500,
  });
}

export type HistoryGroup = {
  entity: string;
  entityId: number;
  authorId: number | null;
  authorName: string;
  versions: ContentVersion[]; // newest first
};

/** Collapse consecutive same-author/same-record edits within GROUP_WINDOW_MS
 *  of each other into one group. Grouping runs on one fetched page at a time
 *  — a burst of edits that straddles a page boundary shows as two groups
 *  instead of one, which is an acceptable display quirk (nothing is lost:
 *  every version still appears, just possibly split across two rows). */
export function groupVersions(rows: ContentVersion[]): HistoryGroup[] {
  const groups: HistoryGroup[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    const sameRecord =
      last && last.entity === row.entity && last.entityId === row.entityId && last.authorId === row.authorId;
    const previous = last?.versions[last.versions.length - 1];
    const withinWindow = previous ? previous.createdAt.getTime() - row.createdAt.getTime() <= GROUP_WINDOW_MS : false;

    if (sameRecord && withinWindow) {
      last.versions.push(row);
    } else {
      groups.push({ entity: row.entity, entityId: row.entityId, authorId: row.authorId, authorName: row.authorName, versions: [row] });
    }
  }
  return groups;
}

/** Records whose most recent version is a DELETE — i.e. currently in the
 *  trash. One that was deleted and later restored (RESTORE, task #24) picks
 *  up a newer version and drops out of this list on its own, no extra
 *  bookkeeping needed. */
export async function getDeletedEntities(): Promise<ContentVersion[]> {
  // Bounded scan: the most recent slice of deletions, then narrowed down to
  // "still deleted" below. Unlike the main feed this isn't paginated — the
  // trash is expected to stay small in practice (things get restored or
  // simply stay gone), but the cap keeps a pathological case from scanning
  // the whole table.
  const candidates = await prisma.contentVersion.findMany({
    where: { action: "DELETE" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 500,
  });
  if (!candidates.length) return [];

  const maxVersions = await prisma.contentVersion.groupBy({
    by: ["entity", "entityId"],
    where: { OR: candidates.map((c) => ({ entity: c.entity, entityId: c.entityId })) },
    _max: { version: true },
  });
  const maxMap = new Map(maxVersions.map((m) => [`${m.entity}:${m.entityId}`, m._max.version]));

  return candidates.filter((c) => maxMap.get(`${c.entity}:${c.entityId}`) === c.version);
}

// ── Presentation helpers — pure, no DB access, safe to call from a server
//    component before handing plain strings down to a client component. ──

export function parseSnapshot(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function firstString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

/** The display name for one version's record, read from that version's own
 *  snapshot (not the live row) — a deleted or since-renamed record still
 *  shows the name it had at that point. hy-first, matching the site's
 *  default-locale order (see /admin/projects) rather than portfolio's
 *  older en-first admin display. */
export function entityLabel(entity: string, snapshot: Record<string, unknown>): string {
  switch (entity) {
    case "Project":
      return firstString(snapshot.titleHy, snapshot.titleRu, snapshot.titleEn, snapshot.title) || "Untitled project";
    case "Person":
      return firstString(snapshot.nameHy, snapshot.nameRu, snapshot.nameEn, snapshot.name) || "Unnamed person";
    case "Portfolio":
      return firstString(snapshot.titleHy, snapshot.titleRu, snapshot.titleEn, snapshot.title) || "Untitled case";
    case "Partner":
      return firstString(snapshot.name) || "Unnamed partner";
    default:
      return `${entity} #${snapshot.id ?? ""}`;
  }
}

export const ENTITY_TYPE_LABEL: Record<string, string> = {
  Project: "Project",
  Person: "Person",
  Portfolio: "Portfolio",
  Partner: "Partner",
};

/** Where a record's title should link to. Person has no dedicated edit
 *  route — it's edited inline in the /admin/cast directory (cast-manager.tsx
 *  has no per-id deep link), so it points at that page as a whole. */
export function entityHref(entity: string, entityId: number): string {
  switch (entity) {
    case "Project":
      return `/admin/projects/${entityId}/edit`;
    case "Portfolio":
      return `/admin/portfolio/${entityId}/edit`;
    case "Partner":
      return `/admin/partners/${entityId}/edit`;
    case "Person":
      return "/admin/cast";
    default:
      return "/admin/history";
  }
}

export const ACTION_LABEL: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  RESTORE: "Restored",
  PUBLISH: "Published",
  UNPUBLISH: "Unpublished",
};

export const ACTION_PILL: Record<string, string> = {
  CREATE: "border-success/30 bg-success/10 text-success",
  UPDATE: "border-border bg-muted text-muted-foreground",
  DELETE: "border-danger/30 bg-danger/10 text-danger",
  RESTORE: "border-primary/30 bg-primary/10 text-primary",
  PUBLISH: "border-success/30 bg-success/10 text-success",
  UNPUBLISH: "border-warn/25 bg-warn/10 text-warn",
};

export function formatDateOnly(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(d);
}

export function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(d);
}

/** The union of changed fields across a collapsed group's individual
 *  `summary` strings, deduped and re-truncated the same way diff.ts's
 *  summarize() truncates a single version's line. */
export function mergeFieldSummaries(rows: ContentVersion[]): string {
  const parts = new Set<string>();
  for (const r of rows) {
    if (!r.summary) continue;
    for (const token of r.summary.split(", ")) {
      const clean = token.replace(/\s*\+\d+ more$/, "").trim();
      if (clean && clean !== "no visible change") parts.add(clean);
    }
  }
  if (!parts.size) return "no visible change";
  const all = [...parts];
  const shown = all.slice(0, 6);
  const rest = all.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} +${rest} more` : shown.join(", ");
}

/** One version, formatted for display — shared by the /admin/history feed
 *  (group-row.tsx) and the per-record "History" tab (entity-history-panel.tsx).
 *  Structurally the same as group-row.tsx's GroupVersionView; not imported
 *  from there to keep this file free of a dependency on a "use client" module. */
export function toVersionView(v: ContentVersion) {
  return {
    id: v.id,
    version: v.version,
    action: v.action,
    actionLabel: ACTION_LABEL[v.action] ?? v.action,
    actionPill: ACTION_PILL[v.action] ?? ACTION_PILL.UPDATE,
    summary: v.summary ?? "",
    time: `${formatDateOnly(v.createdAt)}, ${formatTime(v.createdAt)}`,
  };
}

/** "Jul 31, 2026, 18:42" for a single save, "Jul 31, 2026, 18:30–18:42" for a
 *  collapsed group — the line every group row (feed or per-record tab) heads
 *  with. */
export function groupHeaderTime(group: HistoryGroup): string {
  const newest = group.versions[0];
  const oldest = group.versions[group.versions.length - 1];
  return group.versions.length > 1
    ? `${formatDateOnly(oldest.createdAt)}, ${formatTime(oldest.createdAt)}–${formatTime(newest.createdAt)}`
    : `${formatDateOnly(newest.createdAt)}, ${formatTime(newest.createdAt)}`;
}

/** Groups one record's own version history for its "History" tab — same
 *  groupVersions() collapsing the main feed uses, mapped down to exactly what
 *  EntityHistoryPanel needs to render (no Type/Record columns: the record is
 *  already the page you're on). */
export function buildEntityHistoryGroups(rows: ContentVersion[]) {
  return groupVersions(rows).map((group) => ({
    authorName: group.authorName,
    headerTime: groupHeaderTime(group),
    mergedSummary: mergeFieldSummaries(group.versions),
    versions: group.versions.map(toVersionView),
  }));
}
