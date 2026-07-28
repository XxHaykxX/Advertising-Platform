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
import { ChevronDown, Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { groupDigits, withExclusive, withTotalSlots } from "./form-shared";
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
  /** SponsorshipTier.id for a row that already exists in the DB; undefined for
   *  a row the editor just added. Saving used to delete every tier and
   *  re-insert the lot, which silently detached the brand applications that
   *  pointed at them (Interest.tierId → null on cascade) and dropped the slot
   *  a creator had already reserved. Carrying the id lets the save update in
   *  place instead. */
  dbId?: number;
  name: string;
  priceAmd: number;
  benefits: string;
  isExclusive: boolean;
  availableSlots: number | null;
  totalSlots: number | null;
};

/** A placement some other project already offers, ready to be added in one
 *  click. Built server-side in lib/data/tier-templates.ts. */
export type TierTemplate = { name: string; benefits: string; uses: number };

export const EMPTY_TIER: TierRow = {
  name: "",
  priceAmd: 0,
  benefits: "",
  isExclusive: false,
  availableSlots: null,
  totalSlots: null,
};

// Visible frame at rest. The borderless version read as a paragraph of text:
// nothing said which parts were editable until you happened to click one.
const cellCls =
  "w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:bg-card disabled:cursor-not-allowed disabled:opacity-60";

export function TiersSection({
  value,
  onChange,
  t,
  templates = [],
}: {
  value: TierRow[];
  onChange: (rows: TierRow[]) => void;
  /** ProjectForm's own locale-aware translator (#15) — see ActorsSection's
   *  matching prop for the reasoning. */
  t: ReturnType<typeof makeUI>;
  /** Placements already used on other projects, offered by the Add menu. */
  templates?: TierTemplate[];
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

  const replaceAt = (rows: TierRow[], i: number, row: TierRow) =>
    rows.map((r, idx) => (idx === i ? row : r));

  function addRow(row: TierRow = EMPTY_TIER) {
    setIds((prev) => [...prev, uid.current++]);
    onChange([...value, { ...row }]);
  }

  const [menuOpen, setMenuOpen] = useState(false);
  // Price is never templated — see lib/data/tier-templates.ts.
  function addFromTemplate(tpl: TierTemplate) {
    addRow({ ...EMPTY_TIER, name: tpl.name, benefits: tpl.benefits });
    setMenuOpen(false);
  }

  /** Gold/Silver/Bronze differ by a price and a line or two, so copying beats
   *  retyping. The clone drops dbId — otherwise the save would update the
   *  source tier twice instead of inserting a new one. */
  function duplicateRow(i: number) {
    const src = value[i];
    const copy: TierRow = {
      ...src,
      dbId: undefined,
      name: src.name ? `${src.name} (${t("projectForm.tiers.copySuffix")})` : "",
    };
    const insert = <T,>(arr: T[], item: T) => [...arr.slice(0, i + 1), item, ...arr.slice(i + 1)];
    setIds((prev) => insert(prev, uid.current++));
    onChange(insert(value, copy));
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
        {/* Split button: the left half still adds a blank row, the chevron
            offers placements other projects already use — the names repeat, so
            retyping them (and their benefit lists) was the bulk of the work. */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => addRow()}
            className={`inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40 ${
              templates.length ? "rounded-l-lg border-r-0" : "rounded-lg"
            }`}
          >
            <Plus className="h-3.5 w-3.5" /> {t("projectForm.tiers.addTier")}
          </button>
          {templates.length ? (
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={t("projectForm.tiers.templates")}
              aria-expanded={menuOpen}
              className="inline-flex items-center rounded-r-lg border border-border px-1.5 py-1.5 text-foreground hover:border-primary/40"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {menuOpen ? (
            <>
              {/* Click-away catcher: a plain overlay beats a document listener
                  that would also have to know about the button that opened it. */}
              <button
                type="button"
                tabIndex={-1}
                aria-hidden
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-72 overflow-hidden rounded-lg border border-border bg-card p-1 shadow-lg">
                <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t("projectForm.tiers.templates")}
                </p>
                {templates.map((tpl) => (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => addFromTemplate(tpl)}
                    className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-muted"
                  >
                    <span className="block text-xs font-medium text-foreground">{tpl.name}</span>
                    {tpl.benefits ? (
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {tpl.benefits.split("\n").filter(Boolean).join(" · ")}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("projectForm.tiers.empty")}</p>
      ) : (
        // @container + @4xl: — the row switches to columns on the CARD's width,
        // not the window's. This card sits in a ~640px form column on a 1280px
        // screen, where the eight-column grid would squeeze Tier name down to
        // ~30px; a viewport breakpoint can't see that.
        <div className="@container overflow-hidden rounded-xl border border-border bg-card">
          {/* Available/Total were 70px: their own placeholders were clipped to
              "Availa"/"Total", so an empty pair of cells gave no clue which was
              which. */}
          <div className="hidden grid-cols-[24px_1fr_120px_92px_92px_104px_2fr_64px] items-center gap-2 border-b border-border bg-muted px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground @4xl:grid">
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
                    onTotalSlots={(totalSlots) => onChange(replaceAt(value, i, withTotalSlots(r, totalSlots)))}
                    onExclusive={(isExclusive) => onChange(replaceAt(value, i, withExclusive(r, isExclusive)))}
                    onBenefits={(benefits) => update(i, { benefits })}
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

/** Digits only, grouped for reading while the field is idle. Kept as text
 *  rather than <input type="number">: a number input can't show "1 500 000",
 *  and its spinner is useless at this scale. The row still stores a number. */
function PriceInput({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: number;
  onChange: (price: number) => void;
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
      // Empty stays empty (placeholder "0" states the value) instead of the
      // literal 0 that had to be deleted before every price entry.
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        setDraft(digits);
        onChange(Number(digits || 0));
      }}
      onFocus={() => setDraft(value ? String(value) : "")}
      onBlur={() => setDraft(null)}
      placeholder={placeholder}
      className={className}
    />
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
  onDuplicate,
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
  onDuplicate: () => void;
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
      className={`grid grid-cols-[24px_1fr_64px] items-start gap-x-2 gap-y-1 px-3 py-1.5 @4xl:grid-cols-[24px_1fr_120px_92px_92px_104px_2fr_64px] @4xl:items-start ${
        isDragging ? "" : "hover:bg-muted/50"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="col-start-1 row-span-4 mt-1.5 cursor-grab touch-none self-start text-muted-foreground active:cursor-grabbing @4xl:row-span-1 @4xl:mt-1.5"
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
      <PriceInput
        value={r.priceAmd}
        onChange={onPrice}
        placeholder="0"
        className={`${cellCls} col-start-2 row-start-2 tabular-nums @4xl:col-start-3 @4xl:row-start-1`}
      />
      {/* Available + Total + Exclusive share a row on mobile (a plain flex
          row); at sm+ the wrapper switches to `display: contents` so all
          children drop straight into the parent grid as their own columns. */}
      <div className="col-start-2 row-start-3 flex items-center gap-3 @4xl:contents">
        <input
          type="number"
          min={0}
          value={r.availableSlots ?? ""}
          onChange={(e) => onSlots(e.target.value === "" ? null : Number(e.target.value))}
          placeholder={t("projectForm.tiers.slots")}
          className={`${cellCls} flex-1 @4xl:col-start-4 @4xl:row-start-1`}
        />
        {/* Locked at 1 while Exclusive is on — the checkbox owns the number,
            so leaving it editable would only let the two contradict. */}
        <input
          type="number"
          min={0}
          value={r.totalSlots ?? ""}
          onChange={(e) => onTotalSlots(e.target.value === "" ? null : Number(e.target.value))}
          placeholder={t("projectForm.tiers.totalSlots")}
          disabled={r.isExclusive}
          title={r.isExclusive ? t("projectForm.tiers.exclusiveHint") : undefined}
          className={`${cellCls} flex-1 @4xl:col-start-5 @4xl:row-start-1`}
        />
        <label className="flex shrink-0 items-center gap-1.5 text-xs text-foreground @4xl:col-start-6 @4xl:row-start-1">
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
        className={`${cellCls} col-span-2 col-start-2 row-start-4 resize-none overflow-hidden @4xl:col-span-1 @4xl:col-start-7 @4xl:row-start-1`}
      />

      <div className="col-start-3 row-start-1 mt-1 flex items-center justify-self-end self-start @4xl:col-start-8 @4xl:justify-self-auto">
        <button
          type="button"
          onClick={onDuplicate}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
          aria-label={t("projectForm.tiers.duplicate")}
          title={t("projectForm.tiers.duplicate")}
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
          aria-label={t("projectForm.remove")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
