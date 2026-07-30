"use client";

import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Honest upload progress: a block that fills bottom-to-top as the bytes go out,
 * with the percentage large in the middle.
 *
 * It is shaped 16:9 by default because that is what it replaces — it renders
 * INSIDE a drop zone, in the slot the uploaded picture is about to occupy, so
 * the field doesn't jump when the upload lands. `size="square"` matches a
 * portrait field, `size="row"` is the short variant for a table row.
 *
 * The fill is SOLID, and the readability problem that usually forces a pale tint
 * is solved by drawing the label twice instead of weakening the colour. The
 * first copy is dark on the empty track; the second is white on the fill and
 * clipped to exactly the filled part, so whichever side of the rising line a
 * character is on, it is the readable one. A tint was tried first (2026-07-30)
 * and the owner rejected it on sight: at 100% the block was a flat pale
 * rectangle with washed-out text and read as decoration, not activity.
 */

const progressBlock = cva(
  "relative w-full overflow-hidden rounded-xl border border-border bg-card",
  {
    variants: {
      size: {
        block: "aspect-video",
        /** Portrait fields (an avatar) preview square, so the bar has to too. */
        square: "aspect-square",
        row: "h-20",
      },
    },
    defaultVariants: { size: "block" },
  },
);

const MB = 1024 * 1024;

export type UploadProgressProps = VariantProps<typeof progressBlock> & {
  /** Bytes sent so far. */
  value: number;
  /** Bytes in total. 0 while the browser hasn't told us yet. */
  max?: number;
  /** The big centred "NN%". Off for a bar too small to carry it. */
  showValue?: boolean;
  /** Name of the file being sent, or "2 / 5" style position in a batch. */
  caption?: string;
  onCancel?: () => void;
  /** Localized by the caller — the creator forms are not in English. */
  cancelLabel?: string;
  className?: string;
};

export function UploadProgress({
  value,
  max = 100,
  size,
  showValue = true,
  caption,
  onCancel,
  cancelLabel = "Cancel",
  className,
}: UploadProgressProps) {
  const total = max > 0 ? max : 0;
  const percent = total > 0 ? Math.min(100, Math.max(0, Math.round((value / total) * 100))) : 0;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={caption}
      className={cn(progressBlock({ size }), className)}
    >
      <StripeKeyframes />

      {/* Copy one: dark on the empty track. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 px-3 text-center">
        {showValue ? (
          <span className="text-3xl font-semibold tabular-nums text-foreground">{percent}%</span>
        ) : null}
        {total > 0 ? (
          <span className="text-xs tabular-nums text-muted-foreground">
            {(value / MB).toFixed(1)} / {(total / MB).toFixed(1)} MB
          </span>
        ) : null}
        {caption ? (
          <span className="max-w-full truncate text-xs text-muted-foreground">{caption}</span>
        ) : null}
      </div>

      {/* Copy two, on the solid fill, clipped to the filled part. Full-size and
          laid out identically to copy one — that is what keeps the two in exact
          register, so a character straddling the line is half dark, half white
          rather than two glyphs a pixel apart. clip-path, not a height on this
          element: a shorter box would re-centre its own contents and the text
          would slide as the fill rose. */}
      <div
        className="pointer-events-none absolute inset-0 bg-primary text-primary-foreground transition-[clip-path] duration-200 ease-out"
        style={{ clipPath: `inset(${100 - percent}% 0 0 0)` }}
      >
        <div className="igv-upload-stripes absolute inset-0 opacity-20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-3 text-center">
          {showValue ? (
            <span className="text-3xl font-semibold tabular-nums">{percent}%</span>
          ) : null}
          {total > 0 ? (
            <span className="text-xs tabular-nums opacity-90">
              {(value / MB).toFixed(1)} / {(total / MB).toFixed(1)} MB
            </span>
          ) : null}
          {caption ? (
            <span className="max-w-full truncate text-xs opacity-90">{caption}</span>
          ) : null}
        </div>
      </div>

      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          aria-label={cancelLabel}
          title={cancelLabel}
          className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-md border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

/** The moving stripes.
 *
 *  Keyframes can't be expressed as Tailwind utilities and globals.css is shared
 *  by the whole site, so the animation ships with the component that needs it.
 *  React hoists and de-duplicates this by `href`, so N progress blocks on one
 *  page still emit one <style>.
 *
 *  16px of gradient period at 45° is 16*√2 ≈ 22.63px of horizontal travel — the
 *  shift that makes the loop seamless. */
function StripeKeyframes() {
  return (
    <style href="igv-upload-stripes" precedence="default">{`
      .igv-upload-stripes {
        /* White, not var(--primary): since 2026-07-30 these stripes sit ON the
           solid primary fill, and primary-on-primary is an invisible texture. */
        background-image: repeating-linear-gradient(
          45deg,
          rgba(255, 255, 255, 0.9) 0 8px,
          transparent 8px 16px
        );
        animation: igv-upload-stripes 0.9s linear infinite;
      }
      @keyframes igv-upload-stripes {
        to { background-position: 22.63px 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        .igv-upload-stripes { animation: none; }
      }
    `}</style>
  );
}
