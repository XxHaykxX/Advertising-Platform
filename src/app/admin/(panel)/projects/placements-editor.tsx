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
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { groupDigits } from "./form-shared";
import { MediaField } from "@/components/media-field";
import type { MediaPickerScope } from "@/components/media-picker";
import type { makeUI, Locale } from "@/lib/i18n";

// Controlled Product Placements section (owner correction 2026-07-28): the
// brand appearing INSIDE the story (a scene, a prop, the hero's car) — a
// separate thing from Sponsors (the logo-on-materials deal in
// tiers-editor.tsx), which it sits above in the form. Same shape/contract as
// TiersSection: rows are owned by the parent ProjectForm, mirrored into a
// hidden `placementsRows` input, and persisted by create/updateProject in the
// same transaction as the project (array order → sortOrder). dbId is carried
// so a save updates a row in place instead of delete+reinsert — see
// TierRow.dbId for why that matters (it silently detached brand applications
// last time this shortcut was taken).
//
// Two differences from the tier editor: each row carries an image (a still of
// the scene/slot), and price is OPTIONAL — empty means "on request" and the
// row stores `null`, never a literal 0.
export type PlacementRow = {
  /** Placement.id for a row that already exists in the DB; undefined for a
   *  row the editor just added — see TierRow.dbId in tiers-editor.tsx. */
  dbId?: number;
  title: string;
  description: string; // newline-separated in the UI; JSON string[] at rest, same convention as tier benefits
  image: string; // "/uploads/…" or "" — unset
  priceAmd: number | null; // null -> "on request"
  availableSlots: number | null;
  totalSlots: number | null;
};

export const EMPTY_PLACEMENT: PlacementRow = {
  title: "",
  description: "",
  image: "",
  priceAmd: null,
  availableSlots: null,
  totalSlots: null,
};

// Visible frame at rest — same reasoning as tiers-editor's cellCls.
const cellCls =
  "w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:bg-card disabled:cursor-not-allowed disabled:opacity-60";

export function PlacementsSection({
  value,
  onChange,
  t,
  scope = "staff",
  locale,
}: {
  value: PlacementRow[];
  onChange: (rows: PlacementRow[]) => void;
  /** ProjectForm's own locale-aware translator (#15) — see TiersSection's
   *  matching prop for the reasoning. */
  t: ReturnType<typeof makeUI>;
  /** "member" keeps a creator's uploads inside their own namespace, same as
   *  every other picker in this form. */
  scope?: MediaPickerScope;
  /** Language for the media dialog (audit 4.5). */
  locale?: Locale;
}) {
  // Stable client-side ids parallel to `value` — see TiersSection for why
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

  function update(i: number, patch: Partial<PlacementRow>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setIds((prev) => [...prev, uid.current++]);
    onChange([...value, { ...EMPTY_PLACEMENT }]);
  }

  /** Clone drops dbId — otherwise the save would update the source row twice
   *  instead of inserting a new one (see TiersSection.duplicateRow). */
  function duplicateRow(i: number) {
    const src = value[i];
    const copy: PlacementRow = {
      ...src,
      dbId: undefined,
      title: src.title ? `${src.title} (${t("projectForm.placements.copySuffix")})` : "",
    };
    const insert = <T,>(arr: T[], item: T) => [...arr.slice(0, i + 1), item, ...arr.slice(i + 1)];
    setIds((prev) => insert(prev, uid.current++));
    onChange(insert(value, copy));
  }

  function removeRow(i: number) {
    setIds((prev) => prev.filter((_, idx) => idx !== i));
    onChange(value.filter((_, idx) => idx !== i));
  }

  /** Typing Total also fills Available when the two haven't diverged yet — a
   *  fresh row always wants both equal (nothing sold). Same idea as
   *  form-shared's withTotalSlots, but inlined: that helper requires an
   *  `isExclusive` field placements don't have. */
  function onTotalSlots(i: number, totalSlots: number | null) {
    onChange(
      value.map((r, idx) => {
        if (idx !== i) return r;
        const diverged = r.availableSlots !== null && r.availableSlots !== r.totalSlots;
        return { ...r, totalSlots, availableSlots: diverged ? r.availableSlots : totalSlots };
      }),
    );
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
          {value.length} {t(value.length === 1 ? "projectForm.placements.one" : "projectForm.placements.many")}
        </p>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
        >
          <Plus className="h-3.5 w-3.5" /> {t("projectForm.placements.add")}
        </button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("projectForm.placements.empty")}</p>
      ) : (
        // @container + @4xl: — same reasoning as TiersSection: the row reacts
        // to the CARD's width (~640px in this form column), not the viewport.
        <div className="@container overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden grid-cols-[24px_150px_1fr_110px_90px_90px_2fr_64px] items-center gap-2 border-b border-border bg-muted px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground @4xl:grid">
            <span />
            <span>{t("projectForm.placements.image")}</span>
            <span>{t("projectForm.placements.title")}</span>
            <span>{t("projectForm.placements.price")}</span>
            <span>{t("projectForm.placements.slots")}</span>
            <span>{t("projectForm.placements.totalSlots")}</span>
            <span>{t("projectForm.placements.description")}</span>
            <span />
          </div>
          <DndContext
            id="placement-rows"
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-border">
                {value.map((r, i) => (
                  <PlacementTableRow
                    key={ids[i]}
                    id={ids[i]}
                    row={r}
                    t={t}
                    scope={scope}
                    locale={locale}
                    onImage={(image) => update(i, { image })}
                    onTitle={(title) => update(i, { title })}
                    onPrice={(priceAmd) => update(i, { priceAmd })}
                    onSlots={(availableSlots) => update(i, { availableSlots })}
                    onTotalSlots={(totalSlots) => onTotalSlots(i, totalSlots)}
                    onDescription={(description) => update(i, { description })}
                    onDuplicate={() => duplicateRow(i)}
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

/** Digits only, grouped for reading while idle — same as tiers-editor's
 *  PriceInput, except empty stores `null` ("on request") instead of a literal
 *  0: this row's price is genuinely optional. */
function PriceInput({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: number | null;
  onChange: (price: number | null) => void;
  className: string;
  placeholder: string;
}) {
  // Non-null only while the field is focused, so typing isn't fighting the
  // regrouping — the separators land on blur.
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value ? groupDigits(String(value)) : "");

  return (
    <input
      type="text"
      inputMode="numeric"
      value={shown}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        setDraft(digits);
        onChange(digits === "" ? null : Number(digits));
      }}
      onFocus={() => setDraft(value ? String(value) : "")}
      onBlur={() => setDraft(null)}
      placeholder={placeholder}
      className={className}
    />
  );
}

function PlacementTableRow({
  id,
  row: r,
  t,
  scope,
  locale,
  onImage,
  onTitle,
  onPrice,
  onSlots,
  onTotalSlots,
  onDescription,
  onDuplicate,
  onDelete,
}: {
  id: number;
  row: PlacementRow;
  t: ReturnType<typeof makeUI>;
  scope: MediaPickerScope;
  locale?: Locale;
  onImage: (image: string) => void;
  onTitle: (title: string) => void;
  onPrice: (price: number | null) => void;
  onSlots: (slots: number | null) => void;
  onTotalSlots: (slots: number | null) => void;
  onDescription: (description: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  // Auto-grow the description textarea to fit its content — same as
  // TiersSection's benefits field.
  const descRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const ta = descRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [r.description]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
    backgroundColor: isDragging ? "var(--card)" : undefined,
    boxShadow: isDragging ? "0 8px 24px -8px rgb(0 0 0 / 0.35)" : undefined,
  };

  // Desktop: one 8-column grid row. Mobile (<@4xl): image / title / price /
  // slots+total / description stack to five lines beside the handle, actions
  // pinned top-right — same pattern as TiersSection's mobile stack, one row
  // longer for the image.
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[24px_1fr_64px] items-start gap-x-2 gap-y-2 px-3 py-2 @4xl:grid-cols-[24px_150px_1fr_110px_90px_90px_2fr_64px] @4xl:items-start ${
        isDragging ? "" : "hover:bg-muted/50"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="col-start-1 row-span-5 mt-1.5 cursor-grab touch-none self-start text-muted-foreground active:cursor-grabbing @4xl:row-span-1 @4xl:mt-1.5"
        aria-label={`${t("projectForm.placements.remove")} — drag ${r.title || ""}`.trim()}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* No `name` — this row list mirrors into the parent's `placementsRows`
          hidden input itself, so the picked path only needs to reach
          onImage, not a hidden input of its own (see media-field.tsx). */}
      <div className="col-start-2 row-start-1 @4xl:col-start-2">
        <MediaField
          initial={r.image}
          onChange={onImage}
          label={t("btn.browse")}
          uploadDir="projects"
          scope={scope}
          locale={locale}
          compact
          dropTitle={t("projectForm.placements.image")}
          dropLabel={t("media.dropHereOne")}
          errTooLargeLabel={t("media.errTooLargeShort")}
          replaceLabel={t("media.replace")}
          removeLabel={t("ui.remove")}
          dropReplaceLabel={t("media.dropToReplace")}
        />
      </div>

      <input
        value={r.title}
        onChange={(e) => onTitle(e.target.value)}
        placeholder={t("projectForm.placements.titlePlaceholder")}
        className={`${cellCls} col-start-2 row-start-2 @4xl:col-start-3 @4xl:row-start-1`}
      />
      <PriceInput
        value={r.priceAmd}
        onChange={onPrice}
        placeholder={t("projectForm.placements.priceOnRequest")}
        className={`${cellCls} col-start-2 row-start-3 tabular-nums @4xl:col-start-4 @4xl:row-start-1`}
      />
      {/* Available + Total share a row on mobile (a plain flex row); at @4xl
          the wrapper switches to `display: contents` so both children drop
          straight into the parent grid as their own columns — same trick as
          TiersSection. */}
      <div className="col-start-2 row-start-4 flex items-center gap-3 @4xl:contents">
        <input
          type="number"
          min={0}
          value={r.availableSlots ?? ""}
          onChange={(e) => onSlots(e.target.value === "" ? null : Number(e.target.value))}
          placeholder={t("projectForm.placements.slots")}
          className={`${cellCls} flex-1 @4xl:col-start-5 @4xl:row-start-1`}
        />
        <input
          type="number"
          min={0}
          value={r.totalSlots ?? ""}
          onChange={(e) => onTotalSlots(e.target.value === "" ? null : Number(e.target.value))}
          placeholder={t("projectForm.placements.totalSlots")}
          className={`${cellCls} flex-1 @4xl:col-start-6 @4xl:row-start-1`}
        />
      </div>
      {/* Auto-height (ref + effect above): show every description line at
          rest, including soft-wrapped ones — no collapse-until-focus. */}
      <textarea
        ref={descRef}
        value={r.description}
        onChange={(e) => onDescription(e.target.value)}
        rows={2}
        placeholder={t("projectForm.placements.descriptionPlaceholder")}
        className={`${cellCls} col-span-2 col-start-2 row-start-5 resize-none overflow-hidden @4xl:col-span-1 @4xl:col-start-7 @4xl:row-start-1`}
      />

      <div className="col-start-3 row-start-1 mt-1 flex items-center justify-self-end self-start @4xl:col-start-8 @4xl:justify-self-auto">
        <button
          type="button"
          onClick={onDuplicate}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
          aria-label={t("projectForm.placements.duplicate")}
          title={t("projectForm.placements.duplicate")}
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
          aria-label={t("projectForm.placements.remove")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
