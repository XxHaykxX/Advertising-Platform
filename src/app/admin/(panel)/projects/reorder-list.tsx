"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, Loader2, Plus, Search, X } from "lucide-react";
import { useUI } from "@/lib/i18n-client";
import { ActiveToggle, DeleteButton } from "./row-actions";
import { reorderProjects } from "./actions";
import { mediaUrl } from "@/lib/media-url";

export type ProjectRow = {
  id: number;
  poster: string | null;
  title: string;
  isActive: boolean;
  /** Owner's company name, or their personal name when the account has no
   *  company set (see page.tsx) — the Owner column and its filter both key
   *  off this one field, so what you filter by is exactly what you see. */
  ownerName: string;
  /** Placement deadline has passed — the project is out of the public catalog
   *  and no longer takes offers. Derived on the server from
   *  applicationDeadline (see isArchived in src/lib/data/format.ts), never
   *  stored, so it is always in sync with the date on the form. */
  archived: boolean;
  /** How many of the report page's blocks this project leaves empty (audit
   *  B8). An empty block doesn't render at all on the public page, so from
   *  this list a half-filled project is indistinguishable from a finished
   *  one — the badge is the only place the gap shows up before somebody opens
   *  the form. */
  incomplete: number;
};

// --- Client-side filtering (redesign §3.4) -------------------------------
// Filters the already-loaded rows; no server round-trip. Status filter was
// removed per user request (2026-07-25) — search + visibility only.
// Grew two more dimensions on 2026-07-30: incomplete-only and owner.

type Filters = { query: string; active: string; archive: string; incomplete: boolean; owner: string };

const NO_FILTERS: Filters = { query: "", active: "ALL", archive: "ALL", incomplete: false, owner: "ALL" };

function isFiltering(f: Filters) {
  return (
    f.query.trim() !== "" ||
    f.active !== "ALL" ||
    f.archive !== "ALL" ||
    f.incomplete ||
    f.owner !== "ALL"
  );
}

function applyFilters(rows: ProjectRow[], f: Filters) {
  const q = f.query.trim().toLowerCase();
  return rows.filter(
    (p) =>
      (!q || p.title.toLowerCase().includes(q)) &&
      (f.active === "ALL" || (f.active === "ACTIVE") === p.isActive) &&
      (f.archive === "ALL" || (f.archive === "ARCHIVED") === p.archived) &&
      (!f.incomplete || p.incomplete > 0) &&
      (f.owner === "ALL" || p.ownerName === f.owner),
  );
}

/** Shown next to the title of a project whose placement deadline has passed. */
function ArchivedBadge() {
  return (
    <span className="ml-2 inline-block rounded-full bg-muted px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      Archived
    </span>
  );
}

function IncompleteBadge({ n }: { n: number }) {
  // English, like the rest of the admin panel — but read from the dictionary
  // rather than typed out here: the creator's list shows the same two strings,
  // and a hardcoded copy would drift the moment they are edited in /admin/i18n.
  // Inside the component because useUI reads React context now.
  const tEn = useUI("en");
  return (
    <span
      title={tEn("completeness.badgeTitle", { n })}
      className="ml-2 inline-block rounded-full bg-warn/10 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-warn"
    >
      {tEn("completeness.badge", { n })}
    </span>
  );
}

// Three mutually-exclusive values shown at once with instant apply — a
// segmented control reads faster than a dropdown here. Owner and deadline
// stay <select>s: deadline is only two real states plus "all" but is framed
// as a question ("has the deadline passed?") rather than a mode, and owner's
// option count is unbounded, so a row of buttons would outgrow the toolbar.
function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-border" role="group">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`px-2.5 py-1.5 text-sm transition-colors ${i > 0 ? "border-l border-border" : ""} ${
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-card text-foreground hover:bg-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function FilterBar({
  filters,
  onChange,
  shown,
  total,
  owners,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  shown: number;
  total: number;
  /** Distinct owner names among the rows this table is showing — a Publisher
   *  only ever sees their own name here, so the select is hidden for them
   *  rather than offered as a one-item no-op. */
  owners: string[];
}) {
  const selectCls =
    "rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-primary";
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Search title…"
          className="w-56 rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground">Show:</span>
        <SegmentedControl
          value={filters.active}
          onChange={(v) => onChange({ ...filters, active: v })}
          options={[
            { value: "ALL", label: "All" },
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
          ]}
        />
      </div>
      {/* Archive is derived from the placement deadline, so it can't be
          toggled here — only filtered on. Moving the date in the form is what
          brings a project back. */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground">Deadline:</span>
        <select
          value={filters.archive}
          onChange={(e) => onChange({ ...filters, archive: e.target.value })}
          className={selectCls}
          aria-label="Filter by archive state"
        >
          <option value="ALL">All</option>
          <option value="LIVE">Deadline open</option>
          <option value="ARCHIVED">Archive</option>
        </select>
      </div>
      {owners.length > 1 && (
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">Owner:</span>
          <select
            value={filters.owner}
            onChange={(e) => onChange({ ...filters, owner: e.target.value })}
            className={selectCls}
            aria-label="Filter by owner"
          >
            <option value="ALL">All</option>
            {owners.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={filters.incomplete}
          onChange={(e) => onChange({ ...filters, incomplete: e.target.checked })}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        Incomplete only
      </label>
      {isFiltering(filters) && (
        <>
          <span className="text-sm text-muted-foreground">
            {shown} of {total}
          </span>
          <button
            type="button"
            onClick={() => onChange(NO_FILTERS)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        </>
      )}
    </div>
  );
}

const HEADER_ROW_CLS =
  "border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground";

// SUPERADMIN-only global catalog ordering (T2). Rows are draggable via
// @dnd-kit/sortable (pointer sensor + transform-based drag, so the whole row
// lifts and the rest animate into place — see SortableRow) and, for
// keyboard/accessible use, movable with the ↑/↓ buttons. Both paths funnel
// through move(), which reorders locally (optimistic) then persists the
// whole sequence via reorderProjects — see actions.ts for why this is
// superadmin-only.
//
// While any filter is active, reorder (drag + chevrons) is disabled: the
// catalog order is one global sequence and reordering a filtered subset
// would be ambiguous.
export function ReorderableProjectsTable({
  projects,
  filters,
  onFiltersChange,
}: {
  projects: ProjectRow[];
  /** Owned by ProjectsPanel, not this component — the header's clickable
   *  counters and this table's own FilterBar both need to land on the same
   *  state, and ProjectsPanel is their nearest common ancestor. */
  filters: Filters;
  onFiltersChange: (next: Filters) => void;
}) {
  const [rows, setRows] = useState(projects);

  // `rows` is a local, reorderable copy — but useState only reads its initial
  // value once, so anything the server changed underneath it (a delete, a
  // duplicate, a visibility toggle, another admin's edit) arrived in the
  // `projects` prop after revalidatePath and was ignored: a deleted project
  // stayed on screen until a full page reload. Re-seed whenever the server's
  // list actually differs. The signature (not the array identity) is the
  // dependency, so a re-render with identical data doesn't clobber an
  // in-flight drag; PlainProjectsTable below never had this problem because
  // it renders the prop directly.
  // Adjusted during render, not from an effect — see the same block in
  // partners/reorder-list.tsx.
  const serverSignature = projects.map((p) => `${p.id}:${p.isActive}:${p.title}`).join("|");
  const [seenSignature, setSeenSignature] = useState(serverSignature);
  if (seenSignature !== serverSignature) {
    setSeenSignature(serverSignature);
    setRows(projects);
  }
  const [pending, startTransition] = useTransition();
  // Transient "Saved" confirmation, same pattern as profile-form.tsx (IA-28).
  const [showSaved, setShowSaved] = useState(false);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtering = isFiltering(filters);
  const visible = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const owners = useMemo(() => Array.from(new Set(rows.map((p) => p.ownerName))).sort(), [rows]);

  const sensors = useSensors(
    // A small activation distance keeps plain clicks (chevrons, links) from
    // being swallowed as drag starts.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function persist(next: ProjectRow[]) {
    setShowSaved(false);
    startTransition(async () => {
      await reorderProjects(next.map((p) => p.id));
      setShowSaved(true);
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
      savedTimeout.current = setTimeout(() => setShowSaved(false), 2500);
    });
  }

  function move(from: number, to: number) {
    if (filtering) return;
    if (to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setRows(next);
    persist(next);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = rows.findIndex((p) => p.id === active.id);
    const to = rows.findIndex((p) => p.id === over.id);
    if (from === -1 || to === -1) return;
    move(from, to);
  }

  return (
    <div>
      <FilterBar
        filters={filters}
        onChange={onFiltersChange}
        shown={visible.length}
        total={rows.length}
        owners={owners}
      />
      <div className="mb-2 flex h-5 items-center gap-2 text-sm">
        {pending && (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving order…
          </span>
        )}
        {showSaved && !pending && <span className="font-medium text-success">Order saved</span>}
        {filtering && !pending && !showSaved && (
          <span className="text-xs text-muted-foreground">
            Reorder is off while filters are active
          </span>
        )}
      </div>
      {/* DndContext wraps OUTSIDE the table: it renders a hidden aria-live
          <div role="status"> for screen-reader announcements, which is an
          invalid child of <table>. Kept outside, that div lands in the wrapper
          div instead. SortableContext renders no DOM, so it stays around tbody. */}
      <DndContext
        id="project-order"
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className={HEADER_ROW_CLS}>
                <th className="w-10 px-2 py-2.5"></th>
                <th className="px-4 py-2.5 font-medium">Poster</th>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">Active</th>
                <th className="px-4 py-2.5 font-medium">Owner</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <SortableContext items={visible.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No projects match the filters.
                    </td>
                  </tr>
                ) : (
                  visible.map((p, i) => (
                    <SortableRow
                      key={p.id}
                      project={p}
                      dragDisabled={filtering}
                      isFirst={i === 0}
                      isLast={i === visible.length - 1}
                      onMoveUp={() => move(i, i - 1)}
                      onMoveDown={() => move(i, i + 1)}
                    />
                  ))
                )}
              </tbody>
            </SortableContext>
          </table>
        </div>
      </DndContext>
    </div>
  );
}

function SortableRow({
  project: p,
  dragDisabled,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  project: ProjectRow;
  dragDisabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: p.id,
    disabled: dragDisabled,
  });

  // Modern browsers apply CSS transforms to <tr> fine (the classic WebKit
  // "transforms don't affect table rows" bug is long fixed), so the row
  // itself can lift/slide via dnd-kit's transform+transition without giving
  // up native table layout — no need to fake the row with a div/grid.
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
    backgroundColor: isDragging ? "var(--card)" : undefined,
    boxShadow: isDragging ? "0 8px 24px -8px rgb(0 0 0 / 0.35)" : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-border last:border-b-0 ${isDragging ? "" : "hover:bg-muted/50"}`}
    >
      <td className="w-10 px-2 py-2 align-middle">
        <div className={`flex items-center gap-0.5 ${dragDisabled ? "opacity-30" : ""}`}>
          <button
            type="button"
            disabled={dragDisabled}
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing disabled:cursor-default"
            aria-label={`Drag to reorder ${p.title}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex flex-col">
            <button
              type="button"
              disabled={isFirst || dragDisabled}
              onClick={onMoveUp}
              className="grid h-4 w-4 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label={`Move ${p.title} up`}
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              disabled={isLast || dragDisabled}
              onClick={onMoveDown}
              className="grid h-4 w-4 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label={`Move ${p.title} down`}
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </td>
      <td className="px-4 py-2 align-middle">
        <div className="h-10 w-16 overflow-hidden rounded bg-muted">
          {p.poster && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={mediaUrl(p.poster)} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      </td>
      <td className="px-4 py-2 align-middle">
        {/* Title opens the project as visitors see it; editing is its own
            deliberate click. Same rule as the moderation queue and the
            applications inbox — a name is not a request to edit. */}
        <Link
          href={`/reports/${p.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground hover:text-primary"
        >
          {p.title}
        </Link>
        {p.archived && <ArchivedBadge />}
        {p.incomplete > 0 && <IncompleteBadge n={p.incomplete} />}
        <Link
          href={`/admin/projects/${p.id}/edit`}
          className="mt-0.5 block text-xs text-muted-foreground hover:text-primary"
        >
          Edit
        </Link>
      </td>
      <td className="px-4 py-2 align-middle">
        <ActiveToggle id={p.id} active={p.isActive} />
      </td>
      <td className="px-4 py-2 align-middle text-muted-foreground">{p.ownerName}</td>
      <td className="px-4 py-2 align-middle">
        <DeleteButton id={p.id} title={p.title} />
      </td>
    </tr>
  );
}

// PUBLISHER view: same list (filter bar, density) without the reorder column
// — catalog order is a single global sequence, superadmin-only.
export function PlainProjectsTable({
  projects,
  filters,
  onFiltersChange,
}: {
  projects: ProjectRow[];
  /** Same lifted state as ReorderableProjectsTable — see that component. */
  filters: Filters;
  onFiltersChange: (next: Filters) => void;
}) {
  const visible = useMemo(() => applyFilters(projects, filters), [projects, filters]);
  const owners = useMemo(() => Array.from(new Set(projects.map((p) => p.ownerName))).sort(), [projects]);

  return (
    <div>
      <FilterBar
        filters={filters}
        onChange={onFiltersChange}
        shown={visible.length}
        total={projects.length}
        owners={owners}
      />
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className={HEADER_ROW_CLS}>
              <th className="px-4 py-2.5 font-medium">Poster</th>
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Active</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  No projects match the filters.
                </td>
              </tr>
            ) : (
              visible.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                  <td className="px-4 py-2">
                    <div className="h-10 w-16 overflow-hidden rounded bg-muted">
                      {p.poster && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={mediaUrl(p.poster)} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    {/* Same split as the reorderable table above. */}
                    <Link
                      href={`/reports/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {p.title}
                    </Link>
                    {p.archived && <ArchivedBadge />}
                    {p.incomplete > 0 && <IncompleteBadge n={p.incomplete} />}
                    <Link
                      href={`/admin/projects/${p.id}/edit`}
                      className="mt-0.5 block text-xs text-muted-foreground hover:text-primary"
                    >
                      Edit
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <ActiveToggle id={p.id} active={p.isActive} />
                  </td>
                  <td className="px-4 py-2">
                    <DeleteButton id={p.id} title={p.title} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** A number in the header breakdown that, on click, jumps straight to the
 *  matching filter — e.g. "2 unpublished" sets Show:Inactive instead of
 *  making the admin find that combination in the toolbar themselves. */
function CountButton({ n, label, onClick }: { n: number; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="underline decoration-dotted underline-offset-2 hover:text-foreground"
    >
      {n} {label}
    </button>
  );
}

// Owns the one Filters state shared by the header's clickable counters and
// the table's own FilterBar below it — the two used to live in separate
// components (page.tsx rendered the counters, the table owned the filters),
// so a number here had nothing to set. This is now the page's actual body;
// page.tsx just fetches the rows and renders this.
export function ProjectsPanel({
  rows,
  isSuperadmin,
  awaitingModeration,
}: {
  rows: ProjectRow[];
  isSuperadmin: boolean;
  awaitingModeration: number;
}) {
  const [filters, setFilters] = useState(NO_FILTERS);

  // These three aren't mutually exclusive (a project can be both unpublished
  // and archived at once), so they're independent counts, not a partition —
  // same as the old separate paragraphs they replace.
  const inCatalog = rows.filter((p) => p.isActive && !p.archived).length;
  const unpublished = rows.filter((p) => !p.isActive).length;
  const archivedCount = rows.filter((p) => p.archived).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          {/* "in catalog" used to count every row, including the ones not in
              the catalog at all. Count what the visitor can actually see. */}
          <p className="mt-1 text-sm text-muted-foreground">
            <CountButton
              n={inCatalog}
              label="in catalog"
              onClick={() => setFilters({ ...NO_FILTERS, active: "ACTIVE", archive: "LIVE" })}
            />
            {unpublished > 0 && (
              <>
                {" · "}
                <CountButton
                  n={unpublished}
                  label="unpublished"
                  onClick={() => setFilters({ ...NO_FILTERS, active: "INACTIVE" })}
                />
              </>
            )}
            {archivedCount > 0 && (
              <>
                {" · "}
                <CountButton
                  n={archivedCount}
                  label="in archive"
                  onClick={() => setFilters({ ...NO_FILTERS, archive: "ARCHIVED" })}
                />
              </>
            )}
          </p>
          {awaitingModeration > 0 ? (
            <p className="mt-1 text-sm">
              <Link href="/admin/moderation" className="text-warn hover:underline">
                {awaitingModeration} awaiting moderation →
              </Link>
            </p>
          ) : null}
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New project
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">
          No projects.
        </div>
      ) : isSuperadmin ? (
        // T2: catalog display order (sortOrder — see src/lib/data/projects.ts)
        // is a single global sequence, so drag-to-reorder only makes sense
        // from the superadmin's full-list view.
        <div className="mt-6">
          <ReorderableProjectsTable projects={rows} filters={filters} onFiltersChange={setFilters} />
        </div>
      ) : (
        <div className="mt-6">
          <PlainProjectsTable projects={rows} filters={filters} onFiltersChange={setFilters} />
        </div>
      )}
    </div>
  );
}
