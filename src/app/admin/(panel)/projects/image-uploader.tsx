"use client";

import { forwardRef, useImperativeHandle, useState, useTransition } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
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
import { uploadImage } from "@/lib/actions/uploads";
import { uploadMemberImage } from "@/lib/actions/member-uploads";
import type { Locale } from "@/lib/i18n";
import { imageSizeHint } from "@/lib/images/size-hint";

/** Mirrors MAX_BYTES in lib/actions/uploads.ts. Checked before the round trip:
 *  past the framework body limit the request is cut off mid-flight and the
 *  server's own message never gets a chance to run. */
const MAX_IMAGE_MB = 8;

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
  /** Language for the media dialog — members see it in their own (audit 4.5). */
  pickerLocale?: Locale;
  browseLabel?: string; // label for the picker button
  dropLabel?: string; // caption inside the drop zone, localized by the caller
  errTooLargeLabel?: string; // shown when a dropped file exceeds the size cap
}>(function ImageUploader({
  name,
  dir,
  multiple = false,
  initial = "",
  onChange,
  trailing,
  removeLabel = "Remove",
  scope = "staff",
  pickerLocale,
  browseLabel = "Browse",
  dropLabel = "Drag files here",
  errTooLargeLabel = "File is too large",
}, ref) {
  const [pickerOpen, setPickerOpen] = useState(false);
  // Drag-and-drop upload straight onto the field. The picker dialog could
  // always upload, but reaching a file meant opening a dialog first — there was
  // nowhere on the form itself to drop one.
  const [dragOver, setDragOver] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
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

  /** Files dropped on the zone. Uploads them through the same server action
   *  the picker uses, then appends the returned paths (a single-image field
   *  keeps only the last one, matching what picking does). */
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setDropError(null);
    const upload = scope === "member" ? uploadMemberImage : uploadImage;

    startUpload(async () => {
      const added: string[] = [];
      for (const file of multiple ? files : files.slice(-1)) {
        if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
          setDropError(`${errTooLargeLabel}: ${file.name}`);
          continue;
        }
        const fd = new FormData();
        fd.append("file", file);
        fd.append("dir", dir);
        fd.append("kind", "image");
        // A rejected action (framework 413, a proxy cutting the request) would
        // otherwise reject inside the transition with nothing on screen.
        try {
          const res = await upload(fd);
          if (res.error) setDropError(res.error);
          else if (res.path) added.push(res.path);
        } catch {
          setDropError(`${errTooLargeLabel}: ${file.name}`);
        }
      }
      if (added.length) commit(multiple ? [...paths, ...added] : [added[added.length - 1]]);
    });
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
      {/* The drop zone IS the field: browse button, hint and target in one
          box, so there is somewhere obvious to drag a file to. */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-xl border border-dashed p-3 transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:border-primary/40"
          >
            <ImageIcon className="h-4 w-4" />
            {browseLabel}
          </button>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {dropLabel}
          </span>
          {trailing}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{imageSizeHint(dir)}</p>
        {dropError ? <p className="mt-1 text-xs text-danger">{dropError}</p> : null}
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(path) => commit(multiple ? [...paths, path] : [path])}
        scope={scope}
        uploadDir={dir}
        locale={pickerLocale}
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
