/* Colour marks a translator puts on dictionary rows — the in-admin replacement
   for the row colouring she used to do in the Google Sheet.

   Pure data + one parser, imported by the server actions (validation), the page
   (row mapping) and the editor UI (legend, chips, row accents). The literal
   union matches the `UiDraftMark` enum in prisma/schema.prisma. */

export type Mark = "NONE" | "GREEN" | "RED" | "BLUE";

/** The three colours, in the order they appear in the row switcher. */
export const MARK_LIST = ["GREEN", "RED", "BLUE"] as const;

export type Colour = (typeof MARK_LIST)[number];

/** Meaning + Tailwind classes of one colour. The palette is deliberately not
 *  the semantic tokens (success/danger): those already mean "saved"/"error" in
 *  this editor, and a mark is the translator's own note, not a system state. */
export const MARK_META: Record<
  Colour,
  {
    emoji: string;
    /** Chip label / legend name. */
    label: string;
    /** What the colour means, shown in the legend and in the button title. */
    hint: string;
    /** Filled circle in the row switcher. */
    dot: string;
    /** Left accent bar of a marked row. */
    stripe: string;
    /** Very light row background. */
    tint: string;
    /** Active filter chip. */
    chip: string;
  }
> = {
  GREEN: {
    emoji: "🟢",
    label: "Зелёные",
    hint: "проверено, финально",
    dot: "bg-emerald-500",
    stripe: "border-l-emerald-500",
    tint: "bg-emerald-500/10",
    chip: "border-emerald-500/50 bg-emerald-500/10 text-emerald-600",
  },
  RED: {
    emoji: "🔴",
    label: "Красные",
    hint: "проблема, нужно решение",
    dot: "bg-rose-500",
    stripe: "border-l-rose-500",
    tint: "bg-rose-500/10",
    chip: "border-rose-500/50 bg-rose-500/10 text-rose-600",
  },
  BLUE: {
    emoji: "🔵",
    label: "Голубые",
    hint: "в работе, вернуться позже",
    dot: "bg-sky-500",
    stripe: "border-l-sky-500",
    tint: "bg-sky-500/10",
    chip: "border-sky-500/50 bg-sky-500/10 text-sky-600",
  },
};

/** Emoji spelling of a mark, accepted on CSV import (Excel keeps the glyph). */
const BY_EMOJI: Record<string, Colour> = { "🟢": "GREEN", "🔴": "RED", "🔵": "BLUE" };

/** Narrow anything (form value, CSV cell, JSON body) to a mark. */
export function asMark(value: unknown): Mark {
  const v = typeof value === "string" ? value.trim().toUpperCase() : "";
  return (MARK_LIST as readonly string[]).includes(v) ? (v as Colour) : "NONE";
}

/**
 * Parse a CSV `mark` cell. An empty cell clears the mark, an unrecognized one
 * keeps what the row already has — a stray value from Excel must not silently
 * wipe the translator's colouring.
 */
export function parseMarkCell(raw: string, fallback: Mark): Mark {
  const v = raw.trim();
  if (v === "") return "NONE";
  const byEmoji = BY_EMOJI[v];
  if (byEmoji) return byEmoji;
  const upper = v.toUpperCase();
  return (MARK_LIST as readonly string[]).includes(upper) ? (upper as Colour) : fallback;
}
