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
import { ChevronDown, ChevronUp, GripVertical, Loader2, Search, X } from "lucide-react";
import { ActiveToggle, DeleteButton } from "./row-actions";
import { reorderProjects } from "./actions";

export type ProjectRow = {
  id: number;
  poster: string | null;
  title: string;
  isActive: boolean;
  ownerName: string;
};

// --- Client-side filtering (redesign §3.4) -------------------------------
// Filters the already-loaded rows; no server round-trip. Status filter was
// removed per user request (2026-07-25) — search + visibility only.

type Filters = { query: string; active: string };

const NO_FILTERS: Filters = { query: "", active: "ALL" };

function isFiltering(f: Filters) {
  return f.query.trim() !== "" || f.active !== "ALL";
}

function applyFilters(rows: ProjectRow[], f: Filters) {
  const q = f.query.trim().toLowerCase();
  return rows.filter(
    (p) =>
      (!q || p.title.toLowerCase().includes(q)) &&
      (f.active === "ALL" || (f.active === "ACTIVE") === p.isActive),
  );
}

function FilterBar({
  filters,
  onChange,
  shown,
  total,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  shown: number;
  total: number;
}) {
  const selectCls =
    "rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-primary";
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
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
      <select
        value={filters.active}
        onChange={(e) => onChange({ ...filters, active: e.target.value })}
        className={selectCls}
        aria-label="Filter by visibility"
      >
        <option value="ALL">All</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>
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
export function ReorderableProjectsTable({ projects }: { projects: ProjectRow[] }) {
  const [rows, setRows] = useState(projects);
  const [filters, setFilters] = useState(NO_FILTERS);

  // `rows` is a local, reorderable copy — but useState only reads its initial
  // value once, so anything the server changed underneath it (a delete, a
  // duplicate, a visibility toggle, another admin's edit) arrived in the
  // `projects` prop after revalidatePath and was ignored: a deleted project
  // stayed on screen until a full page reload. Re-seed whenever the server's
  // list actually differs. The signature (not the array identity) is the
  // dependency, so a re-render with identical data doesn't clobber an
  // in-flight drag; PlainProjectsTable below never had this problem because
  // it renders the prop directly.
  const serverSignature = projects.map((p) => `${p.id}:${p.isActive}:${p.title}`).join("|");
  useEffect(() => {
    setRows(projects);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSignature]);
  const [pending, startTransition] = useTransition();
  // Transient "Saved" confirmation, same pattern as profile-form.tsx (IA-28).
  const [showSaved, setShowSaved] = useState(false);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtering = isFiltering(filters);
  const visible = useMemo(() => applyFilters(rows, filters), [rows, filters]);

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
      <FilterBar filters={filters} onChange={setFilters} shown={visible.length} total={rows.length} />
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
            <img src={p.poster} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      </td>
      <td className="px-4 py-2 align-middle">
        <Link href={`/admin/projects/${p.id}/edit`} className="font-medium text-foreground hover:text-primary">
          {p.title}
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
export function PlainProjectsTable({ projects }: { projects: ProjectRow[] }) {
  const [filters, setFilters] = useState(NO_FILTERS);
  const visible = useMemo(() => applyFilters(projects, filters), [projects, filters]);

  return (
    <div>
      <FilterBar
        filters={filters}
        onChange={setFilters}
        shown={visible.length}
        total={projects.length}
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
                        <img src={p.poster} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/projects/${p.id}/edit`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {p.title}
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
