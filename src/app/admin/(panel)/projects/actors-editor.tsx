"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
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
import { GripVertical, Plus, Trash2, User, X } from "lucide-react";
import { MediaPicker, type MediaPickerScope } from "@/components/media-picker";
import type { PersonSuggestion } from "@/lib/data/actors";
import type { makeUI } from "@/lib/i18n";

// Controlled cast/crew section (#20²). Rows are owned by the parent ProjectForm —
// cast/crew save together with the main project in a single submit; the parent
// mirrors `value` into a hidden `actorsRows` input and createProject/updateProject
// persist it transactionally (array order → sortOrder).
//
// Redesigned into a compact table editor (admin redesign 3.1): one header row of
// labels, then one ~48px row per person instead of a ~200px bordered card. Photo
// is a 36px avatar chip that opens the MediaPicker directly; rows drag-reorder via
// @dnd-kit (mirrors cast-manager.tsx / reorder-list.tsx). The ActorRow[]/onChange
// data contract and the ActorsSection export are unchanged.
export type ActorRow = { name: string; role: string; kind: string; photo: string };

export const EMPTY_ACTOR: ActorRow = { name: "", role: "", kind: "CAST", photo: "" };

// Borderless-until-focus cell input — reads as a table, edits like a form.
const cellCls =
  "w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-card";

export function ActorsSection({
  value,
  onChange,
  knownPeople = [],
  t,
  scope = "staff",
}: {
  value: ActorRow[];
  onChange: (rows: ActorRow[]) => void;
  scope?: MediaPickerScope;
  /** People previously entered on any project (#11) — backs a <datalist>
   *  autocomplete on the Name field. Picking (or exactly retyping) a known
   *  name autofills role/kind/photo for that row; the fields stay editable
   *  afterwards. */
  knownPeople?: PersonSuggestion[];
  /** ProjectForm's own locale-aware translator (#15) — "en" in admin mode,
   *  the creator's locale in mode="creator". Passed down rather than called
   *  fresh here so both sections always agree with the parent form. */
  t: ReturnType<typeof makeUI>;
}) {
  // Stable client-side ids parallel to `value`. ActorRow has no id (the data
  // contract is index-based) and update() rebuilds row objects on every edit,
  // so neither index nor object identity is a safe React/dnd key. We keep an
  // ids array in lockstep with our own mutations; an effect re-seeds it only
  // when `value` is swapped wholesale from outside (draft restore / reset),
  // where a remount is fine anyway.
  const uid = useRef(0);
  const makeIds = (n: number) => Array.from({ length: n }, () => uid.current++);
  const [ids, setIds] = useState<number[]>(() => makeIds(value.length));
  useEffect(() => {
    if (ids.length !== value.length) setIds(makeIds(value.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.length]);

  const [pickerFor, setPickerFor] = useState<number | null>(null); // row id
  const nameInputs = useRef<Map<number, HTMLInputElement>>(new Map());
  const [focusId, setFocusId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // New (prepended) rows autofocus the Name input (redesign spec 3.1).
  useEffect(() => {
    if (focusId == null) return;
    nameInputs.current.get(focusId)?.focus();
    setFocusId(null);
  }, [focusId]);

  function update(i: number, patch: Partial<ActorRow>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  // Name changed → if it's an exact (case-insensitive) match for a known
  // person, autofill their last-known role/kind/photo alongside it. A
  // not-yet-known name (still being typed, or genuinely new) just updates
  // the name as normal.
  function updateName(i: number, name: string) {
    const match = knownPeople.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
    if (match) {
      update(i, { name, role: match.role, kind: match.kind, photo: match.photo });
    } else {
      update(i, { name });
    }
  }

  function addRow() {
    const id = uid.current++;
    setIds((prev) => [id, ...prev]);
    onChange([{ ...EMPTY_ACTOR }, ...value]);
    setFocusId(id);
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
          {value.length} {t(value.length === 1 ? "projectForm.cast.member" : "projectForm.cast.members")}
        </p>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
        >
          <Plus className="h-3.5 w-3.5" /> {t("projectForm.cast.addMember")}
        </button>
      </div>

      {/* Shared across every row — same option set, so one <datalist> does. */}
      {knownPeople.length > 0 && (
        <datalist id="known-people-list">
          {knownPeople.map((p) => (
            <option key={p.name} value={p.name}>
              {p.role}
            </option>
          ))}
        </datalist>
      )}

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("projectForm.cast.empty")}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* Header labels (desktop only — mobile rows are self-evident). */}
          <div className="hidden grid-cols-[24px_40px_1fr_1fr_110px_32px] items-center gap-2 border-b border-border bg-muted px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
            <span />
            <span>{t("projectForm.cast.photo")}</span>
            <span>{t("projectForm.cast.name")}</span>
            <span>{t("projectForm.cast.role")}</span>
            <span>{t("projectForm.cast.kind")}</span>
            <span />
          </div>
          <DndContext
            id="cast-rows"
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-border">
                {value.map((r, i) => (
                  <ActorTableRow
                    key={ids[i]}
                    id={ids[i]}
                    row={r}
                    t={t}
                    hasDatalist={knownPeople.length > 0}
                    onName={(name) => updateName(i, name)}
                    onRole={(role) => update(i, { role })}
                    onKind={(kind) => update(i, { kind })}
                    onClearPhoto={() => update(i, { photo: "" })}
                    onOpenPhoto={() => setPickerFor(ids[i])}
                    onDelete={() => removeRow(i)}
                    nameInputRef={(el) => {
                      if (el) nameInputs.current.set(ids[i], el);
                      else nameInputs.current.delete(ids[i]);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <MediaPicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onSelect={(path) => {
          const i = pickerFor === null ? -1 : ids.indexOf(pickerFor);
          if (i !== -1) update(i, { photo: path });
        }}
        scope={scope}
        uploadDir="actors"
      />
    </div>
  );
}

function ActorTableRow({
  id,
  row: r,
  t,
  hasDatalist,
  onName,
  onRole,
  onKind,
  onClearPhoto,
  onOpenPhoto,
  onDelete,
  nameInputRef,
}: {
  id: number;
  row: ActorRow;
  t: ReturnType<typeof makeUI>;
  hasDatalist: boolean;
  onName: (name: string) => void;
  onRole: (role: string) => void;
  onKind: (kind: string) => void;
  onClearPhoto: () => void;
  onOpenPhoto: () => void;
  onDelete: () => void;
  nameInputRef: (el: HTMLInputElement | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  // Same transform+transition lift as reorder-list.tsx / cast-manager.tsx.
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
    backgroundColor: isDragging ? "var(--card)" : undefined,
    boxShadow: isDragging ? "0 8px 24px -8px rgb(0 0 0 / 0.35)" : undefined,
  };

  // Desktop: one 6-column grid row. Mobile (<sm): the same cells wrap to two
  // lines — handle+photo span both rows on the left, name+delete on line 1,
  // role+kind on line 2 — via explicit col/row placement per cell.
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[24px_40px_1fr_1fr] items-center gap-x-2 gap-y-1 px-3 py-1.5 sm:grid-cols-[24px_40px_1fr_1fr_110px_32px] ${
        isDragging ? "" : "hover:bg-muted/50"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="col-start-1 row-span-2 self-center cursor-grab touch-none text-muted-foreground active:cursor-grabbing sm:row-span-1"
        aria-label={`${t("projectForm.remove")} — drag ${r.name || ""}`.trim()}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="group relative col-start-2 row-span-2 h-9 w-9 self-center sm:row-span-1">
        <button
          type="button"
          onClick={onOpenPhoto}
          className="relative h-9 w-9 overflow-hidden rounded-full border border-border bg-muted"
          aria-label={r.photo ? t("projectForm.cast.replacePhoto") : t("projectForm.cast.uploadPhoto")}
        >
          {r.photo ? (
            <Image src={r.photo} alt="" fill className="object-cover" sizes="36px" unoptimized />
          ) : (
            <span className="grid h-full w-full place-items-center text-muted-foreground">
              <User className="h-4 w-4" />
            </span>
          )}
        </button>
        {r.photo && (
          <button
            type="button"
            onClick={onClearPhoto}
            aria-label={t("ui.remove")}
            className="absolute -right-1 -top-1 hidden h-4 w-4 place-items-center rounded-full bg-primary text-white group-hover:grid"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <input
        ref={nameInputRef}
        value={r.name}
        onChange={(e) => onName(e.target.value)}
        list={hasDatalist ? "known-people-list" : undefined}
        placeholder={t("projectForm.cast.name")}
        className={`${cellCls} col-start-3 row-start-1`}
      />
      <input
        value={r.role}
        onChange={(e) => onRole(e.target.value)}
        placeholder={t("projectForm.cast.role")}
        className={`${cellCls} col-start-3 row-start-2 sm:col-start-4 sm:row-start-1`}
      />
      <select
        value={r.kind}
        onChange={(e) => onKind(e.target.value)}
        className={`${cellCls} col-start-4 row-start-2 sm:col-start-5 sm:row-start-1`}
      >
        <option value="CAST">{t("projectForm.cast.kindCast")}</option>
        <option value="CREW">{t("projectForm.cast.kindCrew")}</option>
      </select>

      <button
        type="button"
        onClick={onDelete}
        className="col-start-4 row-start-1 grid h-8 w-8 place-items-center justify-self-end self-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary sm:col-start-6 sm:justify-self-auto"
        aria-label={t("projectForm.remove")}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
