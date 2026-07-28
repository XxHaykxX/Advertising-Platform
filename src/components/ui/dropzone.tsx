"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Upload as UploadIcon } from "lucide-react";
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
 * The zone is a <button>, so nothing focusable may be nested inside it — put a
 * "browse the media library" action NEXT to it, never within.
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
};

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
  ...props
}: DropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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
      {caption && <p className="text-xs text-muted-foreground">{caption}.</p>}
    </>
  );
};
