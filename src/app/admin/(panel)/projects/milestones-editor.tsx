"use client";

import { useEffect, useRef, useState } from "react";
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
import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { useUI } from "@/lib/i18n-client";
import { EMPTY_MILESTONE, type MilestoneRow } from "./form-shared";

// Controlled Production Timeline editor (Ф4/#27). A drag-reorderable list of
// { label, period, active } rows (same "ride along as a hidden JSON input"
// pattern as TiersSection), rendered on the report page as a horizontal
// timeline. Order = array order → sortOrder. `active` is single-select: turning
// one row on turns every other off (exactly one current stage), so the report
// highlights a single node. Labels are free-text Armenian (no localization,
// user decision 2026-07-25).
const cellCls =
  "w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-card";

export function MilestonesSection({
  value,
  onChange,
  t,
}: {
  value: MilestoneRow[];
  onChange: (rows: MilestoneRow[]) => void;
  /** ProjectForm's own locale-aware translator — see TiersSection. */
  t: ReturnType<typeof useUI>;
}) {
  // Stable client-side ids parallel to `value` — see TiersSection for why
  // index/object identity aren't safe keys and how the re-seed effect works.
  // Seeded with plain indices so the ref is never read during render — see
  // useSortableRows (offer-card.tsx), which does the same.
  const uid = useRef(value.length);
  const makeIds = (n: number) => Array.from({ length: n }, () => uid.current++);
  const [ids, setIds] = useState<number[]>(() => Array.from({ length: value.length }, (_, i) => i));
  // Stays an effect: the replacement ids come from the counter ref, which must
  // not be touched during render (react-hooks/refs).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ids.length !== value.length) setIds(makeIds(value.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function update(i: number, patch: Partial<MilestoneRow>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  // Single-select "current stage": setting one row active clears the rest.
  function setActive(i: number) {
    onChange(value.map((r, idx) => ({ ...r, active: idx === i })));
  }

  function addRow() {
    setIds((prev) => [...prev, uid.current++]);
    onChange([...value, { ...EMPTY_MILESTONE }]);
  }

  function removeRow(i: number) {
    setIds((prev) => prev.filter((_, idx) => idx !== i));
    onChange(value.filter((_, idx) => idx !== i));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(active.id as number);
    const to = ids.indexOf(over.id as number);
    if (from === -1 || to === -1) return;
    const moveArr = <T,>(arr: T[]) => {
      const next = [...arr];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    };
    setIds((prev) => moveArr(prev));
    onChange(moveArr(value));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {value.length}{" "}
          {t(value.length === 1 ? "projectForm.milestones.stage" : "projectForm.milestones.stages")}
        </p>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
        >
          <Plus className="h-3.5 w-3.5" /> {t("projectForm.milestones.addStage")}
        </button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("projectForm.milestones.empty")}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden grid-cols-[24px_1fr_140px_1fr_70px_32px] items-center gap-2 border-b border-border bg-muted px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
            <span />
            <span>{t("projectForm.milestones.label")}</span>
            <span>{t("projectForm.milestones.date")}</span>
            <span>{t("projectForm.milestones.note")}</span>
            <span>{t("projectForm.milestones.current")}</span>
            <span />
          </div>
          <DndContext
            id="milestone-rows"
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-border">
                {value.map((r, i) => (
                  <MilestoneTableRow
                    key={ids[i]}
                    id={ids[i]}
                    row={r}
                    t={t}
                    onLabel={(label) => update(i, { label })}
                    onDate={(date) => update(i, { date })}
                    onNote={(note) => update(i, { note })}
                    onActive={() => setActive(i)}
                    onDelete={() => removeRow(i)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

function MilestoneTableRow({
  id,
  row: r,
  t,
  onLabel,
  onDate,
  onNote,
  onActive,
  onDelete,
}: {
  id: number;
  row: MilestoneRow;
  t: ReturnType<typeof useUI>;
  onLabel: (label: string) => void;
  onDate: (date: string) => void;
  onNote: (note: string) => void;
  onActive: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
    backgroundColor: isDragging ? "var(--card)" : undefined,
    boxShadow: isDragging ? "0 8px 24px -8px rgb(0 0 0 / 0.35)" : undefined,
  };

  // Desktop: one 6-column grid row (handle | label | date | note | current |
  // delete). Mobile (<sm): label / date / note / current stack beside the
  // handle, delete pinned top-right.
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[24px_1fr_32px] items-start gap-x-2 gap-y-1 px-3 py-1.5 sm:grid-cols-[24px_1fr_140px_1fr_70px_32px] sm:items-center ${
        isDragging ? "" : "hover:bg-muted/50"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="col-start-1 row-span-4 mt-1.5 cursor-grab touch-none self-start text-muted-foreground active:cursor-grabbing sm:row-span-1 sm:mt-0 sm:self-center"
        aria-label={`${t("projectForm.remove")} — drag ${r.label || ""}`.trim()}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <input
        value={r.label}
        onChange={(e) => onLabel(e.target.value)}
        placeholder={t("projectForm.milestones.labelPlaceholder")}
        className={`${cellCls} col-start-2 row-start-1`}
      />
      <input
        type="date"
        value={r.date}
        onChange={(e) => onDate(e.target.value)}
        className={`${cellCls} col-start-2 row-start-2 sm:col-start-3 sm:row-start-1`}
      />
      <input
        value={r.note}
        onChange={(e) => onNote(e.target.value)}
        placeholder={t("projectForm.milestones.notePlaceholder")}
        className={`${cellCls} col-start-2 row-start-3 sm:col-start-4 sm:row-start-1`}
      />
      <label className="col-start-2 row-start-4 flex items-center gap-1.5 py-1.5 text-xs text-foreground sm:col-start-5 sm:row-start-1 sm:justify-center sm:py-0">
        <input
          type="checkbox"
          checked={r.active}
          onChange={onActive}
          className="h-4 w-4 accent-primary"
        />
        <span className="sm:hidden">{t("projectForm.milestones.current")}</span>
      </label>

      <button
        type="button"
        onClick={onDelete}
        className="col-start-3 row-start-1 grid h-8 w-8 place-items-center justify-self-end self-start rounded-lg text-muted-foreground hover:bg-muted hover:text-primary sm:col-start-6 sm:self-center sm:justify-self-auto"
        aria-label={t("projectForm.remove")}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
