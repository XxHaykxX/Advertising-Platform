"use client";

import { useRef, useState, useTransition } from "react";
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
import { ChevronDown, ChevronUp, ExternalLink, GripVertical, Loader2 } from "lucide-react";
import { DeleteButton } from "./row-actions";
import { reorderPartners } from "./actions";
import { mediaUrl } from "@/lib/media-url";

export type PartnerRow = {
  id: number;
  name: string;
  logo: string | null;
  url: string | null;
};

const HEADER_ROW_CLS =
  "border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground";

/* Partners in the order they appear in the trust strip, set by dragging —
   same pattern as the Projects and Portfolio tables. The "Sort" column and the
   "Sort order" number field are gone: the list IS the order. */
export function ReorderablePartnersTable({ partners }: { partners: PartnerRow[] }) {
  const [rows, setRows] = useState(partners);

  // Re-seed when the server list changes underneath us (delete, edit, another
  // admin) — useState alone would keep showing a stale copy until a reload.
  // Adjusted during render rather than from an effect (React's "you might not
  // need an effect"): the re-render happens before anything is painted, so the
  // stale list is never shown for a frame.
  const serverSignature = partners.map((p) => `${p.id}:${p.name}:${p.logo}`).join("|");
  const [seenSignature, setSeenSignature] = useState(serverSignature);
  if (seenSignature !== serverSignature) {
    setSeenSignature(serverSignature);
    setRows(partners);
  }

  const [pending, startTransition] = useTransition();
  const [showSaved, setShowSaved] = useState(false);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function persist(next: PartnerRow[]) {
    setShowSaved(false);
    startTransition(async () => {
      await reorderPartners(next.map((p) => p.id));
      setShowSaved(true);
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
      savedTimeout.current = setTimeout(() => setShowSaved(false), 2500);
    });
  }

  function move(from: number, to: number) {
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
      <div className="mb-2 flex h-5 items-center gap-2 text-sm">
        {pending && (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving order…
          </span>
        )}
        {showSaved && !pending && <span className="font-medium text-success">Order saved</span>}
        {!pending && !showSaved && (
          <span className="text-xs text-muted-foreground">
            Drag a row to change the order logos appear in on the site
          </span>
        )}
      </div>

      {/* DndContext outside the table — it renders an aria-live <div>, which is
          an invalid child of <table>. */}
      <DndContext
        id="partner-order"
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className={HEADER_ROW_CLS}>
                <th className="w-10 px-2 py-2.5"></th>
                <th className="px-4 py-2.5 font-medium">Logo</th>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Website</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <SortableContext items={rows.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {rows.map((p, i) => (
                  <SortableRow
                    key={p.id}
                    partner={p}
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
  partner: p,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  partner: PartnerRow;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });

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
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
            aria-label={`Drag to reorder ${p.name}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              aria-label={`Move ${p.name} up`}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              aria-label={`Move ${p.name} down`}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </td>
      <td className="px-4 py-2">
        {/* object-contain, not cover: a wide wordmark cropped to a square is
            unrecognizable — the same reason MediaField takes fit="contain". */}
        <div className="grid h-10 w-20 place-items-center overflow-hidden rounded bg-muted p-1">
          {p.logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={mediaUrl(p.logo)} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-[10px] text-muted-foreground">no logo</span>
          )}
        </div>
      </td>
      <td className="px-4 py-2 font-medium text-foreground">{p.name}</td>
      <td className="max-w-[240px] px-4 py-2">
        {p.url ? (
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 truncate text-muted-foreground hover:text-primary"
          >
            <span className="truncate">{p.url.replace(/^https?:\/\//, "")}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="px-4 py-2">
        {/* Edit + Delete both live in DeleteButton (a pencil and a trash icon) —
            the row must not add a second Edit of its own. */}
        <div className="flex items-center justify-end gap-1">
          <DeleteButton id={p.id} name={p.name} />
        </div>
      </td>
    </tr>
  );
}
