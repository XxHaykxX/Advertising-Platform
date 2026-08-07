"use client";

import { createContext, useContext, type ReactNode } from "react";
import { RefreshCw, Trash2, Upload as UploadIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";
import type { DropEvent, DropzoneOptions, FileRejection } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * File drop zone: click to open the OS picker, or drag files onto it.
 *
 * Adapted from the shadcn-style component the owner picked (2026-07-28) so
 * every upload field on the site looks and behaves the same. Two deliberate
 * differences from the upstream snippet:
 *
 *  - it renders THIS project's Button (variant "ghost" + a dashed border)
 *    rather than shadcn's "outline" variant, which this codebase doesn't have.
 *    button.tsx is used by the whole marketing site and was not overwritten.
 *  - the caption strings are props, because the member-facing forms render in
 *    the visitor's language while the admin panel is pinned to English.
 *
 * The EMPTY zone is a <button>, so nothing focusable may be nested inside it —
 * put a "browse the media library" action NEXT to it, never within.
 *
 * Once a field holds something, pass that something as `preview` instead: the
 * root becomes a plain <div> (so Replace/Remove buttons may live on top of the
 * image) and clicking the zone itself no longer opens the OS picker. A field
 * that keeps showing an empty zone next to its own filled preview reads as two
 * separate drop targets — see DropzonePreview.
 */

type DropzoneContextType = {
  src?: File[];
  accept?: DropzoneOptions["accept"];
  maxSize?: DropzoneOptions["maxSize"];
  minSize?: DropzoneOptions["minSize"];
  maxFiles?: DropzoneOptions["maxFiles"];
  labels?: DropzoneLabels;
};

/** Copy shown inside the zone. Defaults are English (admin panel); the creator
 *  forms pass localized strings. */
export type DropzoneLabels = {
  /** Empty state, headline — e.g. "Upload a file". */
  title?: string;
  /** Empty state, second line — e.g. "Drag and drop or click to upload". */
  hint?: string;
  /** Filled state, second line — e.g. "Drag and drop or click to replace". */
  replaceHint?: string;
};

const renderBytes = (bytes: number) => {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)}${units[unitIndex]}`;
};

const DropzoneContext = createContext<DropzoneContextType | undefined>(undefined);

export type DropzoneProps = Omit<DropzoneOptions, "onDrop"> & {
  src?: File[];
  className?: string;
  labels?: DropzoneLabels;
  onDrop?: (acceptedFiles: File[], fileRejections: FileRejection[], event: DropEvent) => void;
  children?: ReactNode;
  /** What the field already holds (an image, a video card, a tile grid). When
   *  set, this renders INSTEAD of the empty-state zone. */
  preview?: ReactNode;
};

/** Opens the OS file picker from inside a `preview`, where the zone itself is
 *  no longer clickable. Null outside a Dropzone so a preview can be rendered
 *  standalone (e.g. in a story or a disabled state). */
const DropzoneOpenContext = createContext<(() => void) | null>(null);
export const useDropzoneOpen = () => useContext(DropzoneOpenContext);

export const Dropzone = ({
  accept,
  maxFiles = 1,
  maxSize,
  minSize,
  onDrop,
  onError,
  disabled,
  src,
  className,
  labels,
  children,
  preview,
  ...props
}: DropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    // A preview holds its own buttons, so the zone must not also swallow
    // clicks (or Enter/Space) and pop the OS picker on top of them.
    noClick: !!preview,
    noKeyboard: !!preview,
    accept,
    maxFiles,
    maxSize,
    minSize,
    onError,
    disabled,
    onDrop: (acceptedFiles, fileRejections, event) => {
      if (fileRejections.length > 0) {
        const message = fileRejections.at(0)?.errors.at(0)?.message;
        onError?.(new Error(message));
        return;
      }

      onDrop?.(acceptedFiles, fileRejections, event);
    },
    ...props,
  });

  if (preview) {
    return (
      <DropzoneContext.Provider
        key={JSON.stringify(src)}
        value={{ src, accept, maxSize, minSize, maxFiles, labels }}
      >
        <DropzoneOpenContext.Provider value={open}>
          <div
            {...getRootProps()}
            className={cn(
              "relative w-fit max-w-full rounded-xl transition-colors",
              // Solid while filled, dashed only under a dragged file: a picture
              // that already sits there doesn't need to look like a target.
              "ring-1 ring-border",
              isDragActive && "ring-2 ring-primary",
              className,
            )}
          >
            <input {...getInputProps()} disabled={disabled} />
            {preview}
            {isDragActive ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl bg-primary/10 text-xs font-medium text-primary">
                {labels?.replaceHint ?? "Drop to replace"}
              </div>
            ) : null}
          </div>
        </DropzoneOpenContext.Provider>
      </DropzoneContext.Provider>
    );
  }

  return (
    <DropzoneContext.Provider
      key={JSON.stringify(src)}
      value={{ src, accept, maxSize, minSize, maxFiles, labels }}
    >
      <Button
        type="button"
        disabled={disabled}
        variant="ghost"
        className={cn(
          "relative h-auto w-full flex-col overflow-hidden rounded-xl border border-dashed border-border p-6 font-normal",
          "hover:border-primary/40 hover:bg-muted/60",
          isDragActive && "border-primary bg-primary/5",
          className,
        )}
        {...getRootProps()}
      >
        <input {...getInputProps()} disabled={disabled} />
        {children}
      </Button>
    </DropzoneContext.Provider>
  );
};

const useDropzoneContext = () => {
  const context = useContext(DropzoneContext);

  if (!context) {
    throw new Error("useDropzoneContext must be used within a Dropzone");
  }

  return context;
};

export type DropzoneContentProps = {
  children?: ReactNode;
};

const maxLabelItems = 3;

/** What the zone shows once files are selected. Renders nothing unless the
 *  caller passes `src` — an uncontrolled field keeps its own preview instead. */
export const DropzoneContent = ({ children }: DropzoneContentProps) => {
  const { src, labels } = useDropzoneContext();

  if (!src) {
    return null;
  }

  if (children) {
    return children;
  }

  return (
    <>
      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <UploadIcon size={16} />
      </div>
      <p className="my-2 w-full truncate text-sm font-medium">
        {src.length > maxLabelItems
          ? `${new Intl.ListFormat("en").format(
              src.slice(0, maxLabelItems).map((file) => file.name),
            )} and ${src.length - maxLabelItems} more`
          : new Intl.ListFormat("en").format(src.map((file) => file.name))}
      </p>
      <p className="w-full text-xs text-muted-foreground">
        {labels?.replaceHint ?? "Drag and drop or click to replace"}
      </p>
    </>
  );
};

/** The filled state of a single-value field: what's already there, with
 *  Replace/Remove surfacing on hover or keyboard focus. Pass it to Dropzone's
 *  `preview` — it needs that provider to reach the file picker. */
export const DropzonePreview = ({
  children,
  replaceLabel,
  removeLabel,
  onRemove,
  iconOnly = false,
  round = false,
}: {
  children: ReactNode;
  replaceLabel: string;
  removeLabel?: string;
  onRemove?: () => void;
  /** Drops the button captions, keeping the icons and their aria-labels. A
   *  96px avatar has no room for two labelled buttons side by side. */
  iconOnly?: boolean;
  /** Circular frame — the overlay has to follow the picture, or a round
   *  avatar grows square corners the moment it's hovered. */
  round?: boolean;
}) => {
  const open = useDropzoneOpen();
  const shape = round ? "rounded-full" : "rounded-xl";
  const buttonClass = cn(
    "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground shadow-sm hover:border-primary/40",
    iconOnly ? "p-1.5" : "px-2.5 py-1.5",
  );

  return (
    <div className={cn("group relative overflow-hidden", shape)}>
      {children}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-2 bg-background/70 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100 focus-within:opacity-100",
          shape,
        )}
      >
        <button
          type="button"
          onClick={() => open?.()}
          aria-label={iconOnly ? replaceLabel : undefined}
          className={buttonClass}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {iconOnly ? null : replaceLabel}
        </button>
        {onRemove && removeLabel ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            className={cn(buttonClass, "hover:text-primary")}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {iconOnly ? null : removeLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export type DropzoneEmptyStateProps = {
  children?: ReactNode;
};

export const DropzoneEmptyState = ({ children }: DropzoneEmptyStateProps) => {
  const { src, accept, maxSize, minSize, maxFiles, labels } = useDropzoneContext();

  if (src) {
    return null;
  }

  if (children) {
    return children;
  }

  let caption = "";

  if (accept) {
    caption += "Accepts ";
    caption += new Intl.ListFormat("en").format(Object.keys(accept));
  }

  if (minSize && maxSize) {
    caption += ` between ${renderBytes(minSize)} and ${renderBytes(maxSize)}`;
  } else if (minSize) {
    caption += ` at least ${renderBytes(minSize)}`;
  } else if (maxSize) {
    caption += ` less than ${renderBytes(maxSize)}`;
  }

  return (
    <>
      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <UploadIcon size={16} />
      </div>
      <p className="my-2 w-full truncate text-sm font-medium">
        {labels?.title ?? `Upload ${maxFiles === 1 ? "a file" : "files"}`}
      </p>
      <p className="w-full truncate text-xs text-muted-foreground">
        {labels?.hint ?? "Drag and drop or click to upload"}
      </p>
      {/* The caption is built from `accept`/`maxSize` in English and can't be
          translated from here. A caller that passed its own labels is
          member-facing — "Accepts image/* less than 8.00MB." underneath two
          Armenian lines was the one English string on the creator's form. The
          admin panel is English anyway, so it keeps it. */}
      {caption && !labels ? <p className="text-xs text-muted-foreground">{caption}.</p> : null}
    </>
  );
};
