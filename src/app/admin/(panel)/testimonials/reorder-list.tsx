"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import { DeleteButton } from "./row-actions";
import { reorderTestimonials } from "./actions";
import { mediaUrl } from "@/lib/media-url";

export type TestimonialRow = {
  id: number;
  image: string | null;
  authorName: string;
  company: string;
  /** Which locales carry a quote — worth seeing at a glance rather than by
   *  opening it. Same idea as PortfolioRow.locales. */
  locales: string[];
};

const HEADER_ROW_CLS =
  "border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground";

/* Testimonials, ordered by drag-and-drop — same pattern as
   ../portfolio/reorder-list.tsx: rows drag via @dnd-kit, ↑/↓ buttons do the
   same thing for keyboard use, and both funnel through move(), which reorders
   optimistically and then persists the whole sequence.

   Search filters the loaded rows; while it's active reorder is off, because
   dragging within a filtered subset has no unambiguous meaning for a global
   order. */
export function ReorderableTestimonialTable({ items }: { items: TestimonialRow[] }) {
  const [rows, setRows] = useState(items);
  const [query, setQuery] = useState("");

  // Re-seed when the server list actually changes (a delete, an edit, another
  // admin) — useState alone would keep showing a stale copy until a reload.
  // Adjusted during render, not from an effect — see the same block in
  // portfolio/reorder-list.tsx.
  const serverSignature = items.map((t) => `${t.id}:${t.authorName}:${t.company}`).join("|");
  const [seenSignature, setSeenSignature] = useState(serverSignature);
  if (seenSignature !== serverSignature) {
    setSeenSignature(serverSignature);
    setRows(items);
  }

  const [pending, startTransition] = useTransition();
  const [showSaved, setShowSaved] = useState(false);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtering = query.trim() !== "";
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (t) => t.authorName.toLowerCase().includes(q) || t.company.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const sensors = useSensors(
    // Small activation distance so a plain click on a link/button isn't
    // swallowed as the start of a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function persist(next: TestimonialRow[]) {
    setShowSaved(false);
    startTransition(async () => {
      await reorderTestimonials(next.map((t) => t.id));
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
    const from = rows.findIndex((t) => t.id === active.id);
    const to = rows.findIndex((t) => t.id === over.id);
    if (from === -1 || to === -1) return;
    move(from, to);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search author or company…"
            className="w-64 rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
          />
        </div>
        {filtering && (
          <>
            <span className="text-sm text-muted-foreground">
              {visible.length} of {rows.length}
            </span>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          </>
        )}
      </div>

      <div className="mb-2 flex h-5 items-center gap-2 text-sm">
        {pending && (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving order…
          </span>
        )}
        {showSaved && !pending && <span className="font-medium text-success">Order saved</span>}
        {filtering && !pending && !showSaved && (
          <span className="text-xs text-muted-foreground">Reorder is off while the search is active</span>
        )}
        {!filtering && !pending && !showSaved && (
          <span className="text-xs text-muted-foreground">
            Drag a row to change the order testimonials appear in on the homepage
          </span>
        )}
      </div>

      {/* DndContext wraps OUTSIDE the table — it renders a hidden aria-live
          <div role="status">, which is an invalid child of <table>. */}
      <DndContext
        id="testimonial-order"
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className={HEADER_ROW_CLS}>
                <th className="w-10 px-2 py-2.5"></th>
                <th className="px-4 py-2.5 font-medium">Image</th>
                <th className="px-4 py-2.5 font-medium">Author</th>
                <th className="px-4 py-2.5 font-medium">Company</th>
                <th className="px-4 py-2.5 font-medium">Languages</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <SortableContext items={visible.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      Nothing matches “{query}”.
                    </td>
                  </tr>
                ) : (
                  visible.map((t, i) => (
                    <SortableRow
                      key={t.id}
                      item={t}
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

const LOCALE_LABEL: Record<string, string> = { hy: "ՀԱՅ", ru: "РУС", en: "ENG" };

function SortableRow({
  item: t,
  dragDisabled,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  item: TestimonialRow;
  dragDisabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: t.id,
    disabled: dragDisabled,
  });

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
            aria-label={`Drag to reorder ${t.authorName}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={dragDisabled || isFirst}
              aria-label={`Move ${t.authorName} up`}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={dragDisabled || isLast}
              aria-label={`Move ${t.authorName} down`}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </td>
      <td className="px-4 py-2">
        <div className="h-10 w-16 overflow-hidden rounded bg-muted">
          {t.image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={mediaUrl(t.image)} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      </td>
      <td className="px-4 py-2 font-medium text-foreground">{t.authorName}</td>
      <td className="px-4 py-2 text-muted-foreground">{t.company}</td>
      <td className="px-4 py-2">
        <div className="flex gap-1">
          {(["hy", "ru", "en"] as const).map((l) => (
            <span
              key={l}
              title={t.locales.includes(l) ? `${LOCALE_LABEL[l]} filled in` : `${LOCALE_LABEL[l]} missing`}
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                t.locales.includes(l)
                  ? "bg-success/15 text-success"
                  : "bg-muted text-muted-foreground/60"
              }`}
            >
              {LOCALE_LABEL[l]}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-2">
        {/* Edit + Delete both live in DeleteButton (a pencil and a trash icon) —
            the row must not add a second Edit of its own. */}
        <div className="flex items-center justify-end gap-1">
          <DeleteButton id={t.id} authorName={t.authorName} />
        </div>
      </td>
    </tr>
  );
}
