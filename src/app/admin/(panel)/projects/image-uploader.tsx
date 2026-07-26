"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import Image from "next/image";
import { ImageIcon, Trash2 } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MediaPicker, type MediaPickerScope } from "@/components/media-picker";
import { imageSizeHint } from "@/lib/images/size-hint";

/** Imperative handle (#26) — lets a sibling component (the "Generate poster"
 *  panel) push a freshly generated image path into an uncontrolled
 *  ImageUploader without the parent form having to lift its state. */
export type ImageUploaderHandle = { addPath: (path: string) => void };

/** Image field backed by the MediaPicker: one "Browse" button opens the picker,
 *  which itself lets you pick an existing image OR upload a new one from the
 *  computer — so there's no separate upload button. Chosen paths are mirrored
 *  into a hidden <input> so the existing form plumbing (poster string /
 *  newline-joined gallery) keeps working unchanged. */
export const ImageUploader = forwardRef<ImageUploaderHandle, {
  name?: string; // when set, mirrors value into a hidden form field
  dir: string;
  multiple?: boolean;
  initial?: string; // single path, or newline-joined paths for multiple
  label?: string; // legacy prop (old upload button) — accepted but unused now
  onChange?: (paths: string[]) => void; // controlled mode (e.g. sub-editor rows)
  trailing?: React.ReactNode; // rendered inline next to the browse button (e.g. an "or Generate poster" action)
  removeLabel?: string; // aria-label for the per-thumbnail remove button, localized by the caller
  scope?: MediaPickerScope; // "member" (creator forms) uploads to /uploads/members/<id>/ and the picker shows only own files
  browseLabel?: string; // label for the picker button
}>(function ImageUploader({
  name,
  dir,
  multiple = false,
  initial = "",
  onChange,
  trailing,
  removeLabel = "Remove",
  scope = "staff",
  browseLabel = "Browse",
}, ref) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [paths, setPaths] = useState<string[]>(
    initial ? initial.split("\n").map((s) => s.trim()).filter(Boolean) : [],
  );

  // Small activation distance keeps a plain click on a thumbnail's remove
  // button from being swallowed as a drag start — same pattern as
  // reorder-list.tsx.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function commit(next: string[]) {
    setPaths(next);
    onChange?.(next);
  }

  function removeAt(i: number) {
    commit(paths.filter((_, idx) => idx !== i));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = paths.indexOf(active.id as string);
    const to = paths.indexOf(over.id as string);
    if (from === -1 || to === -1) return;
    const next = [...paths];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
  }

  useImperativeHandle(ref, () => ({
    addPath(path: string) {
      commit(multiple ? [...paths, path] : [path]);
    },
  }));

  const hiddenValue = multiple ? paths.join("\n") : paths[0] ?? "";
  // The poster instance only ever holds one image, so reordering is
  // meaningless there — only the multi-image gallery instance gets drag.
  const sortable = multiple && paths.length > 1;

  return (
    <div className="space-y-3">
      {name ? <input type="hidden" name={name} value={hiddenValue} /> : null}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:border-primary/40"
        >
          <ImageIcon className="h-4 w-4" />
          {browseLabel}
        </button>
        {trailing}
      </div>

      <p className="text-xs text-muted-foreground">{imageSizeHint(dir)}</p>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(path) => commit(multiple ? [...paths, path] : [path])}
        scope={scope}
        uploadDir={dir}
      />

      {paths.length > 0 && (
        sortable ? (
          <DndContext
            id="gallery-images"
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={paths} strategy={rectSortingStrategy}>
              <div className="flex flex-wrap gap-3">
                {paths.map((p, i) => (
                  <SortableThumbnail key={p} id={p} src={p} onRemove={() => removeAt(i)} removeLabel={removeLabel} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-wrap gap-3">
            {paths.map((p, i) => (
              <Thumbnail key={p} src={p} onRemove={() => removeAt(i)} removeLabel={removeLabel} />
            ))}
          </div>
        )
      )}
    </div>
  );
});

/** Plain (non-draggable) thumbnail — used for the single-poster instance and
 *  for a gallery with only one image (nothing to reorder yet). */
function Thumbnail({ src, onRemove, removeLabel }: { src: string; onRemove: () => void; removeLabel: string }) {
  return (
    <div className="group relative aspect-video w-56 overflow-hidden rounded-lg border border-border bg-muted">
      <Image src={src} alt="" fill className="object-cover" sizes="224px" unoptimized />
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Draggable gallery thumbnail — the whole tile is the grab target (no room
 *  for a separate handle at 96px), transform+transition mirror the
 *  reorder-list.tsx table-row treatment so the tile lifts and glides into
 *  its new slot while the rest of the grid animates around it. */
function SortableThumbnail({
  id,
  src,
  onRemove,
  removeLabel,
}: {
  id: string;
  src: string;
  onRemove: () => void;
  removeLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    boxShadow: isDragging ? "0 8px 24px -8px rgb(0 0 0 / 0.35)" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative aspect-video w-56 cursor-grab touch-none overflow-hidden rounded-lg border border-border bg-muted active:cursor-grabbing"
    >
      <Image src={src} alt="" fill className="object-cover" sizes="224px" unoptimized />
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
