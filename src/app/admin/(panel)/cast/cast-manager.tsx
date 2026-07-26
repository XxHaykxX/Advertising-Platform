"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import { GripVertical, Loader2, Plus, Search, Trash2, User, X } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MediaPicker } from "@/components/media-picker";
import type { PersonRow } from "@/lib/data/persons";
import { matchesNameQuery } from "@/lib/translit";
import { ROLE_VALUES, kindForRole } from "@/app/admin/(panel)/projects/form-shared";
import { createPerson, deletePerson, reorderPersons, updatePerson } from "./person-actions";

type PersonPatch = Partial<Pick<PersonRow, "name" | "role" | "kind" | "photo">>;

const inputCls =
  "w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-card";

// Global reusable people (#9) — a compact table editor, one row per person.
// Every field auto-saves (text fields debounced, select/photo immediate);
// reorder uses the same @dnd-kit sortable setup as reorder-list.tsx.
export function CastManager({ persons }: { persons: PersonRow[] }) {
  const [rows, setRows] = useState(persons);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [showSaved, setShowSaved] = useState(false);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  // Pending field edits per row, MERGED across fields. A debounce timer keyed by
  // id only fires once, so editing name then role within the debounce window must
  // accumulate {name, role} — replacing the patch would drop the earlier field.
  const pendingPatches = useRef<Map<number, PersonPatch>>(new Map());
  const [photoPickerId, setPhotoPickerId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PersonRow | null>(null);
  const [deleting, startDelete] = useTransition();
  const nameInputs = useRef<Map<number, HTMLInputElement>>(new Map());
  const [focusId, setFocusId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // New rows autofocus the Name input (redesign spec 3.1).
  useEffect(() => {
    if (focusId == null) return;
    nameInputs.current.get(focusId)?.focus();
    setFocusId(null);
  }, [focusId]);

  function flashSaved() {
    setShowSaved(true);
    if (savedTimeout.current) clearTimeout(savedTimeout.current);
    savedTimeout.current = setTimeout(() => setShowSaved(false), 2000);
  }

  function persist(id: number, patch: PersonPatch) {
    setShowSaved(false);
    startTransition(async () => {
      await updatePerson(id, patch);
      flashSaved();
    });
  }

  // Flush the accumulated patch for a row: cancel any pending timer and persist
  // every field edited since the last save in one updatePerson call.
  function flushPatch(id: number) {
    const timers = debounceTimers.current;
    const existing = timers.get(id);
    if (existing) {
      clearTimeout(existing);
      timers.delete(id);
    }
    const patch = pendingPatches.current.get(id);
    if (!patch) return;
    pendingPatches.current.delete(id);
    persist(id, patch);
  }

  // Text fields debounce (no round-trip per keystroke); select/photo persist
  // immediately since they're already discrete choices. Patches accumulate per
  // row so a debounced name edit isn't lost when a second field changes before
  // the timer fires.
  function updateField(id: number, patch: PersonPatch, debounce = false) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    pendingPatches.current.set(id, { ...pendingPatches.current.get(id), ...patch });
    if (!debounce) {
      flushPatch(id);
      return;
    }
    const timers = debounceTimers.current;
    const existing = timers.get(id);
    if (existing) clearTimeout(existing);
    timers.set(id, setTimeout(() => flushPatch(id), 600));
  }

  function addPerson() {
    setShowSaved(false);
    startTransition(async () => {
      const created = await createPerson();
      setRows((prev) => [created, ...prev]);
      flashSaved();
      setFocusId(created.id);
    });
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setRows(next);
    setShowSaved(false);
    startTransition(async () => {
      await reorderPersons(next.map((r) => r.id));
      flashSaved();
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = rows.findIndex((r) => r.id === active.id);
    const to = rows.findIndex((r) => r.id === over.id);
    if (from === -1 || to === -1) return;
    move(from, to);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    startDelete(async () => {
      await deletePerson(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setDeleteTarget(null);
    });
  }

  // Cross-language substring filter (matchesNameQuery matches latin "raf"
  // against "Ռաֆայել" too) — client-side over the already-loaded rows, same
  // reasoning as the media-manager filename search. `from`/`to` in move()
  // still index into the full `rows` array via id lookup, so dragging within
  // a filtered view reorders correctly.
  const shown = useMemo(() => rows.filter((r) => matchesNameQuery(r.name, search)), [rows, search]);

  return (
    <div>
      <div className="mb-3 flex h-8 items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          {pending && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
            </span>
          )}
          {showSaved && !pending && <span className="font-medium text-success">Saved</span>}
        </div>
        <div className="flex items-center gap-2">
          {rows.length > 0 && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name…"
                className="w-48 rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none sm:w-64"
              />
            </div>
          )}
          <button
            type="button"
            onClick={addPerson}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
          >
            <Plus className="h-3.5 w-3.5" /> Add person
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No one yet — click “Add person” to start the directory.
        </p>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No one matches “{search}”.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-[24px_40px_1fr_1fr_32px] items-center gap-2 border-b border-border bg-muted px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span />
            <span>Photo</span>
            <span>Name</span>
            <span>Role</span>
            <span />
          </div>
          <DndContext
            id="cast-directory"
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={shown.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-border">
                {shown.map((r) => (
                  <SortableRow
                    key={r.id}
                    person={r}
                    onChange={(patch, debounce) => updateField(r.id, patch, debounce)}
                    onOpenPhoto={() => setPhotoPickerId(r.id)}
                    onDelete={() => setDeleteTarget(r)}
                    nameInputRef={(el) => {
                      if (el) nameInputs.current.set(r.id, el);
                      else nameInputs.current.delete(r.id);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <MediaPicker
        open={photoPickerId !== null}
        onClose={() => setPhotoPickerId(null)}
        onSelect={(path) => {
          if (photoPickerId !== null) updateField(photoPickerId, { photo: path });
        }}
        scope="staff"
        uploadDir="cast-crew"
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete “${deleteTarget?.name || "this person"}”?`}
        message="Removed from the global directory. Projects that already credit them keep their own cast rows untouched."
        confirmLabel="Delete"
        pending={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function SortableRow({
  person: r,
  onChange,
  onOpenPhoto,
  onDelete,
  nameInputRef,
}: {
  person: PersonRow;
  onChange: (patch: PersonPatch, debounce?: boolean) => void;
  onOpenPhoto: () => void;
  onDelete: () => void;
  nameInputRef: (el: HTMLInputElement | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: r.id });

  // Same transform+transition lift as reorder-list.tsx's SortableRow — a
  // borderless grid row here instead of a <tr>, but the drag behavior is
  // identical.
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
    backgroundColor: isDragging ? "var(--card)" : undefined,
    boxShadow: isDragging ? "0 8px 24px -8px rgb(0 0 0 / 0.35)" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[24px_40px_1fr_1fr_32px] items-center gap-2 px-3 py-1.5 ${isDragging ? "" : "hover:bg-muted/50"}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label={`Drag to reorder ${r.name || "person"}`}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="group relative h-9 w-9 shrink-0">
        <button
          type="button"
          onClick={onOpenPhoto}
          className="h-9 w-9 overflow-hidden rounded-full border border-border bg-muted"
          aria-label="Change photo"
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
            onClick={() => onChange({ photo: null })}
            aria-label="Remove photo"
            className="absolute -right-1 -top-1 hidden h-4 w-4 place-items-center rounded-full bg-primary text-white group-hover:grid"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <input
        ref={nameInputRef}
        value={r.name}
        onChange={(e) => onChange({ name: e.target.value }, true)}
        placeholder="Name"
        className={inputCls}
      />
      {/* Role picks from the fixed ROLE_VALUES list and DERIVES Cast/Crew
          (kindForRole) — the separate Kind dropdown is gone (user request
          2026-07-26). A legacy free-text role still renders as its own option
          so editing another cell can't silently rewrite it. */}
      <select
        value={r.role}
        onChange={(e) => onChange({ role: e.target.value, kind: kindForRole(e.target.value) })}
        className={inputCls}
      >
        <option value="">—</option>
        {!(ROLE_VALUES as readonly string[]).includes(r.role) && r.role && (
          <option value={r.role}>{r.role}</option>
        )}
        {ROLE_VALUES.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onDelete}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
        aria-label={`Delete ${r.name || "person"}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
