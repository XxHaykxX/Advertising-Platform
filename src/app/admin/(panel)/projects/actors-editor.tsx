"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
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
import { GripVertical, Plus, Trash2, Unlink, User, X } from "lucide-react";
import { MediaPicker, type MediaPickerScope } from "@/components/media-picker";
import { ROLE_VALUES, kindForRole } from "./form-shared";
import type { PersonSuggestion } from "@/lib/data/actors";
import { allSpellings, pickPersonName } from "@/lib/person-name";
import { matchesAnyNameQuery } from "@/lib/translit";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/media-url";
import { DEFAULT_LOCALE, type useUI, type Locale } from "@/lib/i18n-client";

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
//
// Ф3: `role` (single free-text string) became `roles` (string[] against the
// fixed ROLE_VALUES list, one person can hold several) and a new `personId`
// links the row to the global Person directory (null until a name is picked
// from — or newly created via — that directory on save).
//
// 2026-07-26: the Cast/Crew dropdown is gone — `kind` is derived from the first
// picked role (kindForRole) both here and server-side, so the row only asks for
// the role. It stays on ActorRow because the report page groups by it.
export type ActorRow = { name: string; roles: string[]; kind: string; photo: string; personId: number | null };

export const EMPTY_ACTOR: ActorRow = { name: "", roles: [], kind: "CAST", photo: "", personId: null };

// Borderless-until-focus cell input — reads as a table, edits like a form.
const cellCls =
  "w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-card";

export function ActorsSection({
  value,
  onChange,
  knownPeople = [],
  t,
  scope = "staff",
  pickerLocale,
  nameLocale = DEFAULT_LOCALE,
  lockDirectoryPeople = false,
}: {
  value: ActorRow[];
  onChange: (rows: ActorRow[]) => void;
  scope?: MediaPickerScope;
  /** Creator side: rows linked to the shared Person directory show their name
   *  and headshot read-only, with an "Unlink" escape hatch. The directory is
   *  everyone's; a creator editing it would rename that person across every
   *  project using them (owner decision 2026-08-07). */
  lockDirectoryPeople?: boolean;
  /** Which spelling of a person's name to show and store on the row — the
   *  form's own language ("en" in admin, the creator's locale otherwise). The
   *  three spellings live on the Person directory; the server re-snapshots
   *  them onto the Actor row on save, so what the row carries here is only
   *  what the editor displays. */
  nameLocale?: Locale;
  /** Language for the media dialog — members see it in their own (audit 4.5). */
  pickerLocale?: Locale;
  /** The Person directory (Ф3) — backs a searchable dropdown on the Name
   *  field. Picking a person fills name/photo/personId for that row (and, if
   *  the row has no roles yet, prefills their default role); typing a
   *  brand-new name leaves personId null — staff-side that means the row is
   *  dropped on save, creator-side it is kept as a project-local person. */
  knownPeople?: PersonSuggestion[];
  /** ProjectForm's own locale-aware translator (#15) — "en" in admin mode,
   *  the creator's locale in mode="creator". Passed down rather than called
   *  fresh here so both sections always agree with the parent form. */
  t: ReturnType<typeof useUI>;
}) {
  // Stable client-side ids parallel to `value`. ActorRow has no id (the data
  // contract is index-based) and update() rebuilds row objects on every edit,
  // so neither index nor object identity is a safe React/dnd key. We keep an
  // ids array in lockstep with our own mutations; an effect re-seeds it only
  // when `value` is swapped wholesale from outside (draft restore / reset),
  // where a remount is fine anyway.
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

  const [pickerFor, setPickerFor] = useState<number | null>(null); // row id
  const nameInputs = useRef<Map<number, HTMLInputElement>>(new Map());
  const [focusId, setFocusId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // New (prepended) rows autofocus the Name input (redesign spec 3.1).
  // Genuinely an effect — same reasoning as cast-manager.tsx: the input only
  // exists after commit, and clearing the signal ends that DOM work.
  useEffect(() => {
    if (focusId == null) return;
    nameInputs.current.get(focusId)?.focus();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFocusId(null);
  }, [focusId]);

  function update(i: number, patch: Partial<ActorRow>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  // Name typed by hand — always a plain edit, and always disassociates the
  // row from whatever Person it may have been linked to (picking one from the
  // dropdown below is the only way personId gets (re)set).
  function updateName(i: number, name: string) {
    update(i, { name, personId: null });
  }

  // Name PICKED from the Person directory dropdown — fills name/photo/personId,
  // and (only if this row has no roles yet) prefills their default role.
  function selectPerson(i: number, p: PersonSuggestion) {
    const patch: Partial<ActorRow> = {
      name: pickPersonName(nameLocale, p, p.name),
      photo: p.photo,
      personId: p.id ?? null,
    };
    if (value[i].roles.length === 0 && (ROLE_VALUES as readonly string[]).includes(p.role)) {
      patch.roles = [p.role];
      patch.kind = kindForRole(p.role);
    }
    update(i, patch);
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

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("projectForm.cast.empty")}</p>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          {/* No `overflow-hidden` on this wrapper: the name suggestions and the
              Name autocomplete are absolutely-positioned dropdowns that must
              float OUT of the table (over the rows / next section). Clipping
              them cut the Role list and hid the name suggestions. Rounding is
              handled per-edge (header top) instead of by clipping. */}
          <div className="hidden grid-cols-[24px_40px_1fr_1fr_32px] items-center gap-2 rounded-t-xl border-b border-border bg-muted px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
            <span />
            <span>{t("projectForm.cast.photo")}</span>
            <span>{t("projectForm.cast.name")}</span>
            <span>{t("projectForm.cast.role")}</span>
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
                    knownPeople={knownPeople}
                    nameLocale={nameLocale}
                    onName={(name) => updateName(i, name)}
                    onSelectPerson={(p) => selectPerson(i, p)}
                    onRoles={(roles) => update(i, { roles, kind: kindForRole(roles[0] ?? "") })}
                    onClearPhoto={() => update(i, { photo: "" })}
                    onOpenPhoto={() => setPickerFor(ids[i])}
                    // Detaching from the directory clears the headshot too: it
                    // was the Person's, and keeping it would re-attach their
                    // face to a row that is no longer them.
                    onUnlinkPerson={() => update(i, { personId: null, photo: "" })}
                    onDelete={() => removeRow(i)}
                    lockDirectoryPeople={lockDirectoryPeople}
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
        locale={pickerLocale}
      />
    </div>
  );
}

/** Searchable Person-directory dropdown for the Name cell — replaces the old
 *  native <datalist> (which can't cross-language match). Filters knownPeople
 *  with matchesNameQuery (name OR its Armenian->Latin romanization) as the
 *  user types; picking one calls onSelectPerson, typing anything else calls
 *  onChangeName as a plain edit. */
function PersonNameField({
  value,
  knownPeople,
  nameLocale,
  onChangeName,
  onSelectPerson,
  placeholder,
  inputRef,
  unlinked = false,
  unlinkedHint,
  note,
}: {
  value: string;
  knownPeople: PersonSuggestion[];
  nameLocale: Locale;
  onChangeName: (name: string) => void;
  onSelectPerson: (p: PersonSuggestion) => void;
  placeholder: string;
  inputRef: (el: HTMLInputElement | null) => void;
  /** Name is filled but not linked to a directory Person — the row won't be
   *  saved (cast is pick-only). Show a hint so it isn't a silent drop. */
  unlinked?: boolean;
  unlinkedHint: string;
  /** Neutral counterpart to `unlinked` for the creator side, where an unmatched
   *  row IS saved — it just stays local to the project. */
  note?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  // The combobox has many instances on the page (one per cast row), so the
  // listbox it owns needs a per-instance id for aria-controls to point at.
  const listboxId = useId();

  const filtered = useMemo(
    // Search every spelling, not just the displayed one: typing "Арам" must
    // find the person while the form is showing "Aram".
    () => knownPeople.filter((p) => matchesAnyNameQuery(allSpellings(p, p.name), value)).slice(0, 20),
    [knownPeople, value],
  );

  // Same as MultiSelect: a new query resets the highlight, during render so it
  // never lags a frame behind the list it points into.
  const [seenQuery, setSeenQuery] = useState(`${open}:${value}`);
  if (seenQuery !== `${open}:${value}`) {
    setSeenQuery(`${open}:${value}`);
    setActiveIndex(0);
  }

  // Close on outside click — same pattern as MultiSelect/CurrencySwitcher.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  function pick(p: PersonSuggestion) {
    onSelectPerson(p);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const active = filtered[activeIndex];
      if (open && active) {
        e.preventDefault();
        pick(active);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChangeName(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        className={cn(cellCls, unlinked && "border-danger/60 focus:border-danger")}
      />
      {unlinked && !open && (
        <p className="mt-0.5 px-2 text-[11px] leading-tight text-danger">{unlinkedHint}</p>
      )}
      {!unlinked && note && !open && (
        <p className="mt-0.5 px-2 text-[11px] leading-tight text-muted-foreground">{note}</p>
      )}
      {open && filtered.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          // Belt and braces: /admin runs without Lenis, but if smooth scrolling
          // is ever re-enabled here this list must keep its wheel.
          data-lenis-prevent
          className="absolute z-50 mt-1 max-h-64 w-64 max-w-[80vw] overflow-auto rounded-lg border border-border bg-card py-1 shadow-lg shadow-black/10"
        >
          {filtered.map((p, i) => (
            <li key={p.id ?? p.name}>
              <button
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                onClick={() => pick(p)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm",
                  i === activeIndex && "bg-muted",
                )}
              >
                <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                  {p.photo ? (
                    <Image src={mediaUrl(p.photo)} alt="" fill className="object-cover" sizes="24px" unoptimized />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {pickPersonName(nameLocale, p, p.name)}
                </span>
                {p.role && <span className="shrink-0 truncate text-xs text-muted-foreground">{p.role}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActorTableRow({
  id,
  row: r,
  t,
  knownPeople,
  nameLocale,
  onName,
  onSelectPerson,
  onRoles,
  onClearPhoto,
  onOpenPhoto,
  onUnlinkPerson,
  onDelete,
  nameInputRef,
  lockDirectoryPeople = false,
}: {
  id: number;
  row: ActorRow;
  t: ReturnType<typeof useUI>;
  knownPeople: PersonSuggestion[];
  nameLocale: Locale;
  onName: (name: string) => void;
  onSelectPerson: (p: PersonSuggestion) => void;
  onRoles: (roles: string[]) => void;
  onClearPhoto: () => void;
  onOpenPhoto: () => void;
  onUnlinkPerson: () => void;
  onDelete: () => void;
  nameInputRef: (el: HTMLInputElement | null) => void;
  /** Creator side: a row attached to the shared Person directory shows its
   *  name and headshot read-only — those belong to the directory, not to this
   *  project (owner decision 2026-08-07). */
  lockDirectoryPeople?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const locked = lockDirectoryPeople && r.personId != null;

  // Same transform+transition lift as reorder-list.tsx / cast-manager.tsx.
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
    backgroundColor: isDragging ? "var(--card)" : undefined,
    boxShadow: isDragging ? "0 8px 24px -8px rgb(0 0 0 / 0.35)" : undefined,
  };

  // Desktop: one 5-column grid row. Mobile (<sm): the same cells wrap to two
  // lines — handle+photo span both rows on the left, name+delete on line 1,
  // role on line 2 — via explicit col/row placement per cell.
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[24px_40px_1fr_1fr] items-center gap-x-2 gap-y-1 px-3 py-1.5 sm:grid-cols-[24px_40px_1fr_1fr_32px] ${
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

      {/* A row linked to the shared directory is read-only for a creator: the
          name and the headshot belong to a Person other projects use too, and
          the server re-snapshots both from the directory on save regardless of
          what the form posts. Showing editable controls that silently lose
          their value would be worse than showing none. "Unlink" turns the row
          back into this project's own entry. */}
      <div className="group relative col-start-2 row-span-2 h-9 w-9 self-center sm:row-span-1">
        {locked ? (
          <span
            className="relative block h-9 w-9 overflow-hidden rounded-full border border-border bg-muted"
            title={t("projectForm.cast.directoryOwned")}
          >
            {r.photo ? (
              <Image src={mediaUrl(r.photo)} alt="" fill className="object-cover" sizes="36px" unoptimized />
            ) : (
              <span className="grid h-full w-full place-items-center text-muted-foreground">
                <User className="h-4 w-4" />
              </span>
            )}
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={onOpenPhoto}
              className="relative h-9 w-9 overflow-hidden rounded-full border border-border bg-muted"
              aria-label={r.photo ? t("projectForm.cast.replacePhoto") : t("projectForm.cast.uploadPhoto")}
            >
              {r.photo ? (
                <Image src={mediaUrl(r.photo)} alt="" fill className="object-cover" sizes="36px" unoptimized />
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
          </>
        )}
      </div>

      <div className="col-start-3 row-start-1">
        {locked ? (
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm text-foreground" title={r.name}>
              {r.name}
            </span>
            <button
              type="button"
              onClick={onUnlinkPerson}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Unlink className="h-3 w-3" />
              {t("projectForm.cast.unlinkPerson")}
            </button>
          </div>
        ) : (
          <PersonNameField
            value={r.name}
            knownPeople={knownPeople}
            nameLocale={nameLocale}
            onChangeName={onName}
            onSelectPerson={onSelectPerson}
            // A ready-made namePlaceholder key already existed for this field
            // (t("projectForm.cast.name") repeats the "Name" column header
            // instead) but nothing pointed at it (#20 placeholder audit).
            placeholder={t("projectForm.cast.namePlaceholder")}
            inputRef={nameInputRef}
            // The red "won't be saved" warning is an ADMIN truth: staff cast is
            // pick-only. A creator's unmatched row IS saved (it just stays
            // project-local), so it gets a neutral note instead.
            unlinked={!!r.name.trim() && r.personId == null && !lockDirectoryPeople}
            unlinkedHint={t("projectForm.cast.notInDirectory")}
            note={
              lockDirectoryPeople && !!r.name.trim() && r.personId == null
                ? t("projectForm.cast.customPerson")
                : undefined
            }
          />
        )}
      </div>
      <div className="col-start-3 row-start-2 sm:col-start-4 sm:row-start-1">
        {/* One role per person (owner request 2026-07-28). The column still
            stores a string[] — the server, the DTO and the report page are
            unchanged — it just never holds more than one entry now.
            A value that isn't on the list (an older free-text role like
            "Պրոդյուսեր") is offered as its own option, so opening a row that
            has one and saving doesn't quietly blank it. */}
        <select
          value={r.roles[0] ?? ""}
          onChange={(e) => onRoles(e.target.value ? [e.target.value] : [])}
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
        >
          <option value="">{t("projectForm.cast.role")}</option>
          {r.roles[0] && !(ROLE_VALUES as readonly string[]).includes(r.roles[0]) ? (
            <option value={r.roles[0]}>{r.roles[0]}</option>
          ) : null}
          {ROLE_VALUES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="col-start-4 row-start-1 grid h-8 w-8 place-items-center justify-self-end self-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary sm:col-start-5 sm:justify-self-auto"
        aria-label={t("projectForm.remove")}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
