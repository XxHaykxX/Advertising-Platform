"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
import { ChevronDown, ChevronUp, GripVertical, Loader2 } from "lucide-react";
import type { ModerationStatus } from "@prisma/client";
import { RowActions } from "./row-actions";
import { reorderAdSpaces } from "./actions";
import { mediaUrl } from "@/lib/media-url";

export type AdSpaceRow = {
  id: number;
  image: string | null;
  title: string;
  /** Already localized by the page — this component stays free of the
   *  dictionary, same as the portfolio and partners tables. */
  channelLabel: string;
  location: string;
  offerCount: number;
  owner: string;
  status: ModerationStatus;
  isActive: boolean;
};

const HEADER_ROW_CLS =
  "border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground";

const STATUS_PILL: Record<ModerationStatus, string> = {
  DRAFT: "border-border bg-muted text-muted-foreground",
  PENDING: "border-warn/25 bg-warn/10 text-warn",
  APPROVED: "border-success/30 bg-success/10 text-success",
  REJECTED: "border-danger/30 bg-danger/10 text-danger",
};

/* Ad spaces in the order they appear on the site, set by dragging — the same
   pattern (and the same ↑/↓ buttons for keyboard use) as the Portfolio and
   Partners tables.

   `canReorder` is off for a Publisher: its list is filtered to its own rows,
   so writing 0…n-1 over that subset would renumber it on top of everybody
   else's positions. reorderAdSpaces enforces the same rule server-side. */
export function ReorderableAdSpacesTable({
  rows: serverRows,
  canReorder,
}: {
  rows: AdSpaceRow[];
  canReorder: boolean;
}) {
  const [rows, setRows] = useState(serverRows);

  // Re-seed when the server list changes underneath us (delete, edit, another
  // admin) — useState alone would keep showing a stale copy until a reload.
  // Adjusted during render, not from an effect — see the same block in
  // partners/reorder-list.tsx.
  const serverSignature = serverRows.map((s) => `${s.id}:${s.title}:${s.status}:${s.isActive}`).join("|");
  const [seenSignature, setSeenSignature] = useState(serverSignature);
  if (seenSignature !== serverSignature) {
    setSeenSignature(serverSignature);
    setRows(serverRows);
  }

  const [pending, startTransition] = useTransition();
  const [showSaved, setShowSaved] = useState(false);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    // Small activation distance so a plain click on a link/button isn't
    // swallowed as the start of a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function persist(next: AdSpaceRow[]) {
    setShowSaved(false);
    startTransition(async () => {
      await reorderAdSpaces(next.map((s) => s.id));
      setShowSaved(true);
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
      savedTimeout.current = setTimeout(() => setShowSaved(false), 2500);
    });
  }

  function move(from: number, to: number) {
    if (!canReorder) return;
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
    const from = rows.findIndex((s) => s.id === active.id);
    const to = rows.findIndex((s) => s.id === over.id);
    if (from === -1 || to === -1) return;
    move(from, to);
  }

  return (
    <div>
      <div className="mb-2 flex h-5 items-center gap-2 text-sm">
        {pending && (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving order…
          </span>
        )}
        {showSaved && !pending && <span className="font-medium text-success">Order saved</span>}
        {!pending && !showSaved && (
          <span className="text-xs text-muted-foreground">
            {canReorder
              ? "Drag a row to change the order spaces appear in on the site"
              : "Only a superadmin can change the order — this list shows your own spaces only"}
          </span>
        )}
      </div>

      {/* DndContext wraps OUTSIDE the table — it renders a hidden aria-live
          <div role="status">, which is an invalid child of <table>. */}
      <DndContext
        id="ad-space-order"
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className={HEADER_ROW_CLS}>
                <th className="w-10 px-2 py-3"></th>
                <th className="px-4 py-3 font-medium">Photo</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Offers</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <SortableContext items={rows.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {rows.map((s, i) => (
                  <SortableRow
                    key={s.id}
                    space={s}
                    dragDisabled={!canReorder}
                    isFirst={i === 0}
                    isLast={i === rows.length - 1}
                    onMoveUp={() => move(i, i - 1)}
                    onMoveDown={() => move(i, i + 1)}
                  />
                ))}
              </tbody>
            </SortableContext>
          </table>
        </div>
      </DndContext>
    </div>
  );
}

function SortableRow({
  space: s,
  dragDisabled,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  space: AdSpaceRow;
  dragDisabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: s.id,
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
      className={`border-b border-border align-middle last:border-b-0 ${isDragging ? "" : "hover:bg-muted/50"}`}
    >
      <td className="w-10 px-2 py-3 align-middle">
        <div className={`flex items-center gap-0.5 ${dragDisabled ? "opacity-30" : ""}`}>
          <button
            type="button"
            disabled={dragDisabled}
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing disabled:cursor-default"
            aria-label={`Drag to reorder ${s.title}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={dragDisabled || isFirst}
              aria-label={`Move ${s.title} up`}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={dragDisabled || isLast}
              aria-label={`Move ${s.title} down`}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-10 w-16 overflow-hidden rounded bg-muted">
          {s.image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={mediaUrl(s.image)} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/admin/ad-spaces/${s.id}/edit`}
          className="font-medium text-foreground hover:text-primary"
        >
          {s.title}
        </Link>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{s.channelLabel}</td>
      <td className="px-4 py-3 text-muted-foreground">{s.location}</td>
      <td className="px-4 py-3 text-muted-foreground">{s.offerCount}</td>
      <td className="px-4 py-3 text-muted-foreground">{s.owner}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_PILL[s.status]}`}>
          {s.status}
        </span>
        {!s.isActive && (
          <span className="ml-2 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            Hidden
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <RowActions id={s.id} title={s.title} />
      </td>
    </tr>
  );
}
