"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Plus, Trash2 } from "lucide-react";
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
import {
  Dropzone,
  DropzoneEmptyState,
  DropzonePreview,
  useDropzoneOpen,
} from "@/components/ui/dropzone";
import { UploadProgress } from "@/components/ui/upload-progress";
import { uploadViaXhr } from "@/lib/upload-xhr";
import type { Locale } from "@/lib/i18n";
import { imageSizeHint } from "@/lib/images/size-hint";

/** Mirrors MAX_BYTES in lib/uploads-store.ts. Checked before the round trip:
 *  past the framework body limit the request is cut off mid-flight and the
 *  server's own message never gets a chance to run. */
const MAX_IMAGE_MB = 8;

/** Imperative handle (#26) — lets a sibling component (the "Generate poster"
 *  panel) push a freshly generated image path into an uncontrolled
 *  ImageUploader without the parent form having to lift its state. */
export type ImageUploaderHandle = { addPath: (path: string) => void };

/** One file on its way out. Files go one at a time, so there is only ever one. */
type UploadJob = { file: File; loaded: number; total: number; index: number; count: number };

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
  dropTitle?: string; // headline inside the drop zone, localized by the caller
  dropLabel?: string; // second line inside the drop zone, localized by the caller
  errTooLargeLabel?: string; // shown when a dropped file exceeds the size cap
  errUploadFailedLabel?: string; // shown when the upload never came back (offline, 502)
  cancelLabel?: string; // aria-label of the cancel control on the progress block
  replaceLabel?: string; // overlay action on the filled single-image preview
  dropReplaceLabel?: string; // shown while a file hovers over a filled field
  addLabel?: string; // caption of the "+" tile that ends the gallery grid
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
  dropTitle = "Upload files",
  dropLabel = "Drag and drop or click to upload",
  errTooLargeLabel = "File is too large",
  errUploadFailedLabel = "Upload failed",
  cancelLabel = "Cancel upload",
  replaceLabel = "Replace",
  dropReplaceLabel = "Drop to replace",
  addLabel = "Add",
}, ref) {
  const [pickerOpen, setPickerOpen] = useState(false);
  // Drag-and-drop upload straight onto the field. The picker dialog could
  // always upload, but reaching a file meant opening a dialog first — there was
  // nowhere on the form itself to drop one.
  const [dropError, setDropError] = useState<string | null>(null);
  const [job, setJob] = useState<UploadJob | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [paths, setPaths] = useState<string[]>(
    initial ? initial.split("\n").map((s) => s.trim()).filter(Boolean) : [],
  );
  const uploading = job !== null;

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

  /** Files dropped on the zone. Each goes to /api/uploads over XHR rather than
   *  through the upload server action: the checks and the write on the far end
   *  are the same code either way, but only a plain request reports how many
   *  bytes have actually left the browser — which is the whole point of the
   *  bar the zone shows while this runs. One at a time, so the bar means
   *  something; a single-image field keeps only the last one, matching what
   *  picking does. */
  async function handleFiles(files: File[]) {
    if (!files.length) return;
    setDropError(null);

    const queue = multiple ? files : files.slice(-1);
    const controller = new AbortController();
    abortRef.current = controller;

    const added: string[] = [];
    for (const [i, file] of queue.entries()) {
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        setDropError(`${errTooLargeLabel}: ${file.name}`);
        continue;
      }
      setJob({ file, loaded: 0, total: file.size, index: i + 1, count: queue.length });

      const fd = new FormData();
      fd.append("file", file);
      fd.append("dir", dir);
      fd.append("kind", "image");

      const res = await uploadViaXhr(fd, {
        scope,
        signal: controller.signal,
        errorLabel: errUploadFailedLabel,
        onProgress: ({ loaded, total }) =>
          setJob((current) => (current?.file === file ? { ...current, loaded, total } : current)),
      });

      // Cancel means cancel: the rest of the batch is dropped too, and nothing
      // is reported as an error — the user asked for this.
      if (res.canceled) break;
      if (res.error) setDropError(res.error);
      else if (res.path) added.push(res.path);
    }

    abortRef.current = null;
    setJob(null);
    if (added.length) commit(multiple ? [...paths, ...added] : [added[added.length - 1]]);
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

  // The bar takes the slot the picture is about to fill, so the field doesn't
  // jump when the upload lands: in a gallery it stands where the "+" tile is,
  // in a single-image field it IS the zone.
  const progress = job ? (
    <UploadProgress
      value={job.loaded}
      max={job.total}
      caption={job.count > 1 ? `${job.file.name} · ${job.index}/${job.count}` : job.file.name}
      onCancel={() => abortRef.current?.abort()}
      cancelLabel={cancelLabel}
      // Single-image field: the zone already draws a ring around whatever it
      // previews, so the block would otherwise sit inside a doubled frame. In a
      // gallery it is one tile among bordered tiles and keeps its own.
      className={multiple ? "w-56" : "w-72 border-0"}
    />
  ) : null;

  // Filled fields show their content INSTEAD of an empty zone. Keeping both on
  // screen (a big "Upload a file" rectangle above the picture it already holds)
  // read as two competing drop targets — the single complaint behind this
  // rewrite. Empty stays a zone: for adding files, lead with the target.
  const preview = multiple
    ? paths.length || progress
      ? <GalleryGrid
          paths={paths}
          sortable={sortable}
          sensors={sensors}
          onDragEnd={handleDragEnd}
          onRemove={removeAt}
          removeLabel={removeLabel}
          addLabel={addLabel}
          progress={progress}
        />
      : undefined
    : progress
      ? progress
      : paths.length
        ? <DropzonePreview replaceLabel={replaceLabel} removeLabel={removeLabel} onRemove={() => removeAt(0)}>
            <div className="relative aspect-video w-72 max-w-full overflow-hidden bg-muted">
              <Image src={paths[0]} alt="" fill className="object-cover" sizes="288px" unoptimized />
            </div>
          </DropzonePreview>
        : undefined;

  return (
    <div className="space-y-3">
      {name ? <input type="hidden" name={name} value={hiddenValue} /> : null}
      {/* Empty: click opens the OS picker, dragging files onto it uploads them.
          The media LIBRARY is a separate button below — the empty zone is a
          <button>, so nothing focusable may be nested inside it. */}
      <Dropzone
        accept={{ "image/*": [] }}
        multiple={multiple}
        maxFiles={multiple ? 10 : 1}
        maxSize={MAX_IMAGE_MB * 1024 * 1024}
        disabled={uploading}
        onDrop={handleFiles}
        onError={(e) => setDropError(e.message)}
        labels={{ title: dropTitle, hint: dropLabel, replaceHint: dropReplaceLabel }}
        preview={preview}
        className={multiple && (paths.length || progress) ? "w-full" : undefined}
      >
        <DropzoneEmptyState />
      </Dropzone>

      <div className="flex flex-wrap items-center gap-3">
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
      {dropError ? <p className="text-xs text-danger">{dropError}</p> : null}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(path) => commit(multiple ? [...paths, path] : [path])}
        scope={scope}
        uploadDir={dir}
        locale={pickerLocale}
      />

    </div>
  );
});

/** The gallery's filled state: every image as a tile, an "add" tile closing the
 *  row, and the whole grid acting as the drop target (it IS the Dropzone's
 *  preview). Reordering by drag is unchanged — that's pointer-based dnd-kit,
 *  independent of the browser's file-drag events the zone listens for. */
function GalleryGrid({
  paths,
  sortable,
  sensors,
  onDragEnd,
  onRemove,
  removeLabel,
  addLabel,
  progress,
}: {
  paths: string[];
  sortable: boolean;
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  onRemove: (i: number) => void;
  removeLabel: string;
  addLabel: string;
  /** Shown in the "+" tile's place while a file is going out — the slot the
   *  new tile is about to appear in, so the grid doesn't reflow twice. */
  progress?: React.ReactNode;
}) {
  const tiles = paths.map((p, i) =>
    sortable ? (
      <SortableThumbnail key={p} id={p} src={p} onRemove={() => onRemove(i)} removeLabel={removeLabel} />
    ) : (
      <Thumbnail key={p} src={p} onRemove={() => onRemove(i)} removeLabel={removeLabel} />
    ),
  );

  return (
    <div className="w-full p-2">
      {sortable ? (
        <DndContext
          id="gallery-images"
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToParentElement]}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={paths} strategy={rectSortingStrategy}>
            <div className="flex flex-wrap gap-3">
              {tiles}
              {progress ?? <AddTile label={addLabel} />}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tiles}
          {progress ?? <AddTile label={addLabel} />}
        </div>
      )}
    </div>
  );
}

/** Same footprint as a thumbnail so the grid keeps its rhythm — the "one more"
 *  slot is where the eye already is, instead of a separate zone above. */
function AddTile({ label }: { label: string }) {
  const open = useDropzoneOpen();

  return (
    <button
      type="button"
      onClick={() => open?.()}
      className="grid aspect-video w-56 place-items-center gap-1 rounded-lg border border-dashed border-border bg-background text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/60 hover:text-foreground"
    >
      <Plus className="h-5 w-5" />
      {label}
    </button>
  );
}

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
