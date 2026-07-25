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
import type { makeUI } from "@/lib/i18n";

// Controlled sponsorship-tiers section (#20²). Same refactor as ActorsSection:
// rows are owned by the parent ProjectForm, mirrored into a hidden `tiersRows`
// input, and persisted by createProject/updateProject in the same transaction
// (array order → sortOrder). benefits stays a newline-separated string in the
// UI; the server action converts it to a JSON string[] at rest.
//
// Redesigned to match the cast table (admin redesign 3.1): one header row, then
// one row per tier (name | price | benefits) instead of a tall bordered card.
// The benefits cell is a single-line summary that expands to a textarea on
// focus; rows drag-reorder via @dnd-kit. TierRow[]/onChange/TiersSection export
// are unchanged.
export type TierRow = {
  name: string;
  priceAmd: number;
  benefits: string;
  isExclusive: boolean;
  availableSlots: number | null;
  totalSlots: number | null;
};

export const EMPTY_TIER: TierRow = {
  name: "",
  priceAmd: 0,
  benefits: "",
  isExclusive: false,
  availableSlots: null,
  totalSlots: null,
};

const cellCls =
  "w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-card";

export function TiersSection({
  value,
  onChange,
  t,
}: {
  value: TierRow[];
  onChange: (rows: TierRow[]) => void;
  /** ProjectForm's own locale-aware translator (#15) — see ActorsSection's
   *  matching prop for the reasoning. */
  t: ReturnType<typeof makeUI>;
}) {
  // Stable client-side ids parallel to `value` — see ActorsSection for why
  // index/object identity aren't safe keys and how the re-seed effect works.
  const uid = useRef(0);
  const makeIds = (n: number) => Array.from({ length: n }, () => uid.current++);
  const [ids, setIds] = useState<number[]>(() => makeIds(value.length));
  useEffect(() => {
    if (ids.length !== value.length) setIds(makeIds(value.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function update(i: number, patch: Partial<TierRow>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setIds((prev) => [...prev, uid.current++]);
    onChange([...value, { ...EMPTY_TIER }]);
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
          {value.length} {t(value.length === 1 ? "projectForm.tiers.tier" : "projectForm.tiers.tiers")}
        </p>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
        >
          <Plus className="h-3.5 w-3.5" /> {t("projectForm.tiers.addTier")}
        </button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("projectForm.tiers.empty")}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden grid-cols-[24px_1fr_90px_70px_70px_90px_2fr_32px] items-center gap-2 border-b border-border bg-muted px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
            <span />
            <span>{t("projectForm.tiers.name")}</span>
            <span>{t("projectForm.tiers.price")}</span>
            <span>{t("projectForm.tiers.slots")}</span>
            <span>{t("projectForm.tiers.totalSlots")}</span>
            <span>{t("projectForm.tiers.exclusive")}</span>
            <span>{t("projectForm.tiers.benefits")}</span>
            <span />
          </div>
          <DndContext
            id="tier-rows"
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-border">
                {value.map((r, i) => (
                  <TierTableRow
                    key={ids[i]}
                    id={ids[i]}
                    row={r}
                    t={t}
                    onName={(name) => update(i, { name })}
                    onPrice={(priceAmd) => update(i, { priceAmd })}
                    onSlots={(availableSlots) => update(i, { availableSlots })}
                    onTotalSlots={(totalSlots) => update(i, { totalSlots })}
                    onExclusive={(isExclusive) => update(i, { isExclusive })}
                    onBenefits={(benefits) => update(i, { benefits })}
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

function TierTableRow({
  id,
  row: r,
  t,
  onName,
  onPrice,
  onSlots,
  onTotalSlots,
  onExclusive,
  onBenefits,
  onDelete,
}: {
  id: number;
  row: TierRow;
  t: ReturnType<typeof makeUI>;
  onName: (name: string) => void;
  onPrice: (price: number) => void;
  onSlots: (slots: number | null) => void;
  onTotalSlots: (slots: number | null) => void;
  onExclusive: (exclusive: boolean) => void;
  onBenefits: (benefits: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  // Auto-grow the benefits textarea to fit its content (incl. wrapped lines) so
  // the full "one benefit per line" list is visible at rest — never clipped.
  const benefitsRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const ta = benefitsRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [r.benefits]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
    backgroundColor: isDragging ? "var(--card)" : undefined,
    boxShadow: isDragging ? "0 8px 24px -8px rgb(0 0 0 / 0.35)" : undefined,
  };

  // Desktop: one 8-column grid row. Mobile (<sm): name / price / slots+exclusive
  // / benefits stack to four lines beside the handle, delete pinned top-right.
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[24px_1fr_32px] items-start gap-x-2 gap-y-1 px-3 py-1.5 sm:grid-cols-[24px_1fr_90px_70px_70px_90px_2fr_32px] sm:items-start ${
        isDragging ? "" : "hover:bg-muted/50"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="col-start-1 row-span-4 mt-1.5 cursor-grab touch-none self-start text-muted-foreground active:cursor-grabbing sm:row-span-1 sm:mt-1.5"
        aria-label={`${t("projectForm.remove")} — drag ${r.name || ""}`.trim()}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <input
        value={r.name}
        onChange={(e) => onName(e.target.value)}
        placeholder={t("projectForm.tiers.namePlaceholder")}
        className={`${cellCls} col-start-2 row-start-1`}
      />
      <input
        type="number"
        min={0}
        value={r.priceAmd}
        onChange={(e) => onPrice(Number(e.target.value))}
        placeholder={t("projectForm.tiers.price")}
        className={`${cellCls} col-start-2 row-start-2 sm:col-start-3 sm:row-start-1`}
      />
      {/* Available + Total + Exclusive share a row on mobile (a plain flex
          row); at sm+ the wrapper switches to `display: contents` so all
          children drop straight into the parent grid as their own columns. */}
      <div className="col-start-2 row-start-3 flex items-center gap-3 sm:contents">
        <input
          type="number"
          min={0}
          value={r.availableSlots ?? ""}
          onChange={(e) => onSlots(e.target.value === "" ? null : Number(e.target.value))}
          placeholder={t("projectForm.tiers.slots")}
          className={`${cellCls} flex-1 sm:col-start-4 sm:row-start-1`}
        />
        <input
          type="number"
          min={0}
          value={r.totalSlots ?? ""}
          onChange={(e) => onTotalSlots(e.target.value === "" ? null : Number(e.target.value))}
          placeholder={t("projectForm.tiers.totalSlots")}
          className={`${cellCls} flex-1 sm:col-start-5 sm:row-start-1`}
        />
        <label className="flex shrink-0 items-center gap-1.5 text-xs text-foreground sm:col-start-6 sm:row-start-1">
          <input
            type="checkbox"
            checked={r.isExclusive}
            onChange={(e) => onExclusive(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          {t("projectForm.tiers.exclusive")}
        </label>
      </div>
      {/* Auto-height (ref + effect above): show every benefit line at rest,
          including soft-wrapped ones — no collapse-until-focus that hid all but
          the first line. */}
      <textarea
        ref={benefitsRef}
        value={r.benefits}
        onChange={(e) => onBenefits(e.target.value)}
        rows={2}
        placeholder={t("projectForm.tiers.benefitsPlaceholder")}
        className={`${cellCls} col-span-2 col-start-2 row-start-4 resize-none overflow-hidden sm:col-span-1 sm:col-start-7 sm:row-start-1`}
      />

      <button
        type="button"
        onClick={onDelete}
        className="col-start-3 row-start-1 mt-1 grid h-8 w-8 place-items-center justify-self-end self-start rounded-lg text-muted-foreground hover:bg-muted hover:text-primary sm:col-start-8 sm:justify-self-auto"
        aria-label={t("projectForm.remove")}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
