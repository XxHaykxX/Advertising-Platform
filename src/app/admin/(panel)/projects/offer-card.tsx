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
import { sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, Copy, GripVertical, ImageOff, Trash2, X } from "lucide-react";
import { OFFER_LANGS, groupDigits, type OfferLang } from "./form-shared";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MediaField } from "@/components/media-field";
import { BulletListEditor } from "@/components/ui/bullet-list-editor";
import type { MediaPickerScope } from "@/components/media-picker";
import type { makeUI, Locale } from "@/lib/i18n-client";

/**
 * Shared pieces of the two "offer" editors — product placements
 * (placements-editor.tsx) and sponsorship packages (tiers-editor.tsx).
 *
 * Both used to be spreadsheet rows: six inputs squeezed into a ~640px form
 * column, an image thumbnail too narrow for its own hover controls, and a
 * "one benefit per line" textarea whose convention was invisible. What they
 * actually produce is a CARD (still on top, title, price, slots, bullet list —
 * see components/report/product-placements.tsx), so the editor is now shaped
 * like that card. Everything here is layout; the row types, the hidden JSON
 * mirrors and the server contract are unchanged.
 */

/** 16:9 — the aspect both report cards render their still at. Uploads are
 *  cropped to it up front so `object-cover` never surprises the uploader. */
export const OFFER_ASPECT = 16 / 9;

// ── row list plumbing ────────────────────────────────────────────────────
// Stable client-side ids parallel to the rows: array index isn't a safe key
// (reordering would re-key every card) and object identity isn't either (every
// keystroke replaces the row object). Extracted from the two editors, which
// carried the same 40 lines each.
export function useSortableRows<T>(value: T[], onChange: (rows: T[]) => void) {
  const uid = useRef(0);
  const makeIds = (n: number) => Array.from({ length: n }, () => uid.current++);
  const [ids, setIds] = useState<number[]>(() => makeIds(value.length));

  // Re-seed when the parent swaps the whole list (a form reset, a restored
  // draft) — length is the only signal available for that.
  useEffect(() => {
    if (ids.length !== value.length) setIds(makeIds(value.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function append(row: T) {
    const id = uid.current++;
    setIds((prev) => [...prev, id]);
    onChange([...value, row]);
    return id;
  }

  function insertAfter(i: number, row: T) {
    const id = uid.current++;
    const insert = <U,>(arr: U[], item: U) => [...arr.slice(0, i + 1), item, ...arr.slice(i + 1)];
    setIds((prev) => insert(prev, id));
    onChange(insert(value, row));
    return id;
  }

  function removeAt(i: number) {
    setIds((prev) => prev.filter((_, idx) => idx !== i));
    onChange(value.filter((_, idx) => idx !== i));
  }

  function patchAt(i: number, patch: Partial<T>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function replaceAt(i: number, row: T) {
    onChange(value.map((r, idx) => (idx === i ? row : r)));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(active.id as number);
    const to = ids.indexOf(over.id as number);
    if (from === -1 || to === -1) return;
    const moveArr = <U,>(arr: U[]) => {
      const next = [...arr];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    };
    setIds((prev) => moveArr(prev));
    onChange(moveArr(value));
  }

  return { ids, sensors, append, insertAfter, removeAt, patchAt, replaceAt, handleDragEnd };
}

/** Sortable + modifier props every offer list passes to its DndContext. */
export function OfferDndContext({
  id,
  sensors,
  onDragEnd,
  children,
}: {
  id: string;
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (e: DragEndEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={onDragEnd}
    >
      {children}
    </DndContext>
  );
}

// ── the card ─────────────────────────────────────────────────────────────

/** What the collapsed header shows, so a long list stays scannable. */
export type OfferSummary = {
  image: string;
  title: string;
  price: string;
  slots: string;
};

export function OfferCard({
  id,
  summary,
  collapsed,
  onToggle,
  onDuplicate,
  onDelete,
  t,
  header,
  children,
}: {
  id: number;
  summary: OfferSummary;
  collapsed: boolean;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  t: ReturnType<typeof makeUI>;
  /** The title input. It rides in the header row — the card's identity belongs
   *  next to its controls, and it keeps the body's full width for the fields
   *  (the action buttons used to eat ~100px off every row below them). */
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  // A filled card is a few minutes of typing plus an upload, and deleting it
  // was a single unguarded click. An empty one isn't worth a dialog.
  const [confirming, setConfirming] = useState(false);
  const isEmpty = !summary.title && !summary.image;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
    boxShadow: isDragging ? "0 8px 24px -8px rgb(0 0 0 / 0.35)" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-1.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          aria-label={`${t("projectForm.offer.moveUp")} / ${t("projectForm.offer.moveDown")} — ${summary.title || t("projectForm.offer.untitled")}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          {!collapsed ? (
            header
          ) : (
            // Collapsed: the same four facts the public card leads with, on one
            // line. Eight offers used to be eight tall rows of open inputs.
            <button
              type="button"
              onClick={onToggle}
              className="flex w-full items-center gap-3 text-left"
            >
              <span className="relative h-[54px] w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                {summary.image ? (
                  <Image src={summary.image} alt="" fill className="object-cover" sizes="96px" unoptimized />
                ) : (
                  <span
                    className="grid h-full w-full place-items-center text-muted-foreground"
                    // The icon is the only thing in this slot, so it needs a
                    // name of its own — without it the collapsed row reads as
                    // a picture with no description.
                    title={t("projectForm.offer.noImage")}
                    aria-label={t("projectForm.offer.noImage")}
                    role="img"
                  >
                    <ImageOff className="h-4 w-4" aria-hidden />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {summary.title || t("projectForm.offer.untitled")}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[summary.price, summary.slots].filter(Boolean).join(" · ")}
                </span>
              </span>
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? t("projectForm.offer.expand") : t("projectForm.offer.collapse")}
            title={collapsed ? t("projectForm.offer.expand") : t("projectForm.offer.collapse")}
            aria-expanded={!collapsed}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            aria-label={t("projectForm.placements.duplicate")}
            title={t("projectForm.placements.duplicate")}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => (isEmpty ? onDelete() : setConfirming(true))}
            aria-label={t("projectForm.placements.remove")}
            title={t("projectForm.placements.remove")}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body sits BELOW the header strip, indented to the grip, so it gets the
          card's full width instead of the ~500px left over beside the action
          buttons — at that width the still and the fields couldn't share a row. */}
      {collapsed ? null : <div className="px-3 pb-3 pl-9">{children}</div>}

      <ConfirmDialog
        open={confirming}
        title={t("projectForm.offer.deleteTitle", { name: summary.title || t("projectForm.offer.untitled") })}
        message={t("projectForm.offer.deleteMessage")}
        confirmLabel={t("projectForm.placements.remove")}
        cancelLabel={t("projectForm.offer.crop.cancel")}
        onConfirm={() => {
          setConfirming(false);
          onDelete();
        }}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}

/** The card body: still on the left, everything else stacked on the right —
 *  @container, so it reacts to the form column's width and not the viewport's
 *  (this card sits in a ~640px column on a 1280px screen). */
export function OfferCardBody({ still, children }: { still: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="@container">
      {/* @md (28rem), not @lg: the body's own container is ~500px inside the
          form column, so an @lg switch never fired and the still stretched to
          the full card width. Below the breakpoint it stays stacked but capped
          — a full-width 16:9 preview would be 280px tall on its own. */}
      <div className="flex flex-col gap-3 @md:flex-row @md:items-start">
        <div className="w-full max-w-[280px] shrink-0 @md:w-52">{still}</div>
        <div className="min-w-0 flex-1 space-y-2.5">{children}</div>
      </div>
    </div>
  );
}

/** The still, with the recommended size stated once per card instead of never
 *  (the compact MediaField suppresses its own size hint). */
export function OfferStill({
  value,
  onChange,
  t,
  scope,
  locale,
  label,
}: {
  value: string;
  onChange: (path: string) => void;
  t: ReturnType<typeof makeUI>;
  scope: MediaPickerScope;
  locale?: Locale;
  label: string;
}) {
  return (
    <div className="space-y-1">
      {/* No `name`: the parent mirrors the whole row list into its own hidden
          JSON input, so the picked path only has to reach onChange. */}
      <MediaField
        initial={value}
        onChange={onChange}
        label={t("btn.browse")}
        uploadDir="projects"
        scope={scope}
        locale={locale}
        compact
        cropAspect={OFFER_ASPECT}
        dropTitle={label}
        dropLabel={t("media.dropHereOne")}
        errTooLargeLabel={t("media.errTooLargeShort")}
        replaceLabel={t("media.replace")}
        removeLabel={t("ui.remove")}
        dropReplaceLabel={t("media.dropToReplace")}
        cropLabels={{
          title: t("projectForm.offer.crop.title"),
          zoom: t("projectForm.offer.crop.zoom"),
          apply: t("projectForm.offer.crop.apply"),
          cancel: t("projectForm.offer.crop.cancel"),
          hint: t("projectForm.offer.crop.hint"),
        }}
      />
      <p className="text-[11px] text-muted-foreground">{t("projectForm.offer.imageHint")}</p>
    </div>
  );
}

const fieldCls =
  "w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:bg-card disabled:cursor-not-allowed disabled:opacity-60";

/** A labelled field — the table header used to carry these labels, and it
 *  scrolled out of sight after the first card.
 *
 *  A <div>, NOT a <label>: the price field puts BUTTONS under its caption, and
 *  a click on a button inside a label is also forwarded to the label's own
 *  control — the "Set a price / On request" toggle fired twice and read as
 *  unresponsive. Inputs carry their own aria-label instead. */
export function OfferField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

/** Price + slots on one deterministic line: price takes what's left, each slot
 *  box is a fixed 72px. They used to sit in a flex-wrap row where the price
 *  field's own width pushed Available/Total to the right edge or onto their
 *  own line depending on the label's length. */
export function OfferNumbersRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">{children}</div>;
}

/** The card's title. Unlabelled on purpose: it lives in the header row, where
 *  the placeholder and its weight already say what it is. */
export function OfferTitleInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${fieldCls} font-medium`}
    />
  );
}

/**
 * Digits only, grouped for reading while idle. Kept as text rather than
 * <input type="number">: a number input can't show "1 800 000" and its spinner
 * is useless at this scale.
 *
 * With `allowOnRequest` the field is two-state — a price, or an explicit "on
 * request". Empty used to mean the second one silently, which read exactly like
 * a price nobody had typed yet.
 */
export function OfferPriceField({
  value,
  onChange,
  label,
  t,
  allowOnRequest = false,
}: {
  value: number | null;
  onChange: (price: number | null) => void;
  label: string;
  t: ReturnType<typeof makeUI>;
  allowOnRequest?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value ? groupDigits(String(value)) : "");
  // Which of the two states the field is IN, kept locally rather than derived
  // from `value === null`: clearing the box to retype a price must not flip the
  // card into "on request" mid-keystroke and take the input away.
  const [onRequest, setOnRequest] = useState(allowOnRequest && value === null);
  // Last price actually typed, so a stray click on "on request" (which stores
  // null) doesn't throw away a seven-digit figure — switching back restores it.
  const lastPrice = useRef<number | null>(value);

  return (
    <OfferField label={label}>
      {allowOnRequest ? (
        <div className="mb-1.5 inline-flex rounded-lg border border-border p-0.5 text-xs">
          <button
            type="button"
            aria-pressed={!onRequest}
            onClick={() => {
              setOnRequest(false);
              if (lastPrice.current != null) onChange(lastPrice.current);
            }}
            className={`rounded-md px-2 py-1 ${!onRequest ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t("projectForm.offer.priceFixed")}
          </button>
          <button
            type="button"
            aria-pressed={onRequest}
            onClick={() => {
              setOnRequest(true);
              onChange(null);
            }}
            className={`rounded-md px-2 py-1 ${onRequest ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t("projectForm.placements.priceOnRequest")}
          </button>
        </div>
      ) : null}
      {onRequest ? null : (
        <input
          type="text"
          inputMode="numeric"
          value={shown}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            setDraft(digits);
            if (digits !== "") lastPrice.current = Number(digits);
            // An empty box is "no price" where that's a legal state (a
            // placement stores null -> "on request") and 0 where it isn't (a
            // tier price is a plain number).
            onChange(digits === "" ? (allowOnRequest ? null : 0) : Number(digits));
          }}
          onFocus={() => setDraft(value ? String(value) : "")}
          onBlur={() => setDraft(null)}
          placeholder="0"
          aria-label={label}
          className={`${fieldCls} tabular-nums`}
        />
      )}
    </OfferField>
  );
}

/** Available / Total as one labelled pair — two bare number boxes side by side
 *  were unreadable once the table header scrolled away. */
export function OfferSlotsField({
  available,
  total,
  onAvailable,
  onTotal,
  totalDisabled = false,
  totalTitle,
  t,
}: {
  available: number | null;
  total: number | null;
  onAvailable: (v: number | null) => void;
  onTotal: (v: number | null) => void;
  totalDisabled?: boolean;
  totalTitle?: string;
  t: ReturnType<typeof makeUI>;
}) {
  const parse = (v: string) => (v === "" ? null : Number(v));
  return (
    <div className="flex shrink-0 gap-2">
      <OfferField label={t("projectForm.placements.slots")} className="w-[72px]">
        <input
          type="number"
          min={0}
          value={available ?? ""}
          onChange={(e) => onAvailable(parse(e.target.value))}
          aria-label={t("projectForm.placements.slots")}
          className={fieldCls}
        />
      </OfferField>
      <OfferField label={t("projectForm.placements.totalSlots")} className="w-[72px]">
        <input
          type="number"
          min={0}
          value={total ?? ""}
          onChange={(e) => onTotal(parse(e.target.value))}
          disabled={totalDisabled}
          title={totalTitle}
          aria-label={t("projectForm.placements.totalSlots")}
          className={fieldCls}
        />
      </OfferField>
    </div>
  );
}

/** The "what the brand gets" list — one input per bullet, the way it renders. */
export function OfferBullets({
  value,
  onChange,
  label,
  t,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  t: ReturnType<typeof makeUI>;
}) {
  return (
    <div>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <BulletListEditor
        value={value}
        onChange={onChange}
        placeholder={t("projectForm.offer.bulletPlaceholder")}
        addLabel={t("projectForm.offer.addBullet")}
        removeLabel={t("projectForm.offer.removeBullet")}
        moveUpLabel={t("projectForm.offer.moveUp")}
        moveDownLabel={t("projectForm.offer.moveDown")}
        emptyHint={t("projectForm.offer.bulletEmpty")}
      />
    </div>
  );
}

// ── "how it looks on the site" ───────────────────────────────────────────

export type OfferPreviewItem = {
  image: string;
  title: string;
  price: string;
  slots: string;
  bullets: string[];
  badge?: string;
};

/** A replica of the report-page card grid (product-placements.tsx /
 *  sponsors.tsx). Deliberately a replica and not the real component: those take
 *  a fully-built ProjectDetailDTO, which the form doesn't have until it saves.
 *  Keep the two in step when the public card changes. */
export function OfferPreviewDialog({
  open,
  onClose,
  title,
  items,
  t,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  items: OfferPreviewItem[];
  t: ReturnType<typeof makeUI>;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-5xl rounded-2xl border border-border bg-background p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("projectForm.offer.previewHint")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("ui.close")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div key={i} className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
              {item.image ? (
                <div className="relative aspect-video w-full bg-muted">
                  <Image src={item.image} alt="" fill className="object-cover" sizes="33vw" unoptimized />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {item.title || t("projectForm.offer.untitled")}
                  </h3>
                  {item.badge ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xl font-extrabold text-foreground">{item.price}</p>
                {item.slots ? <p className="mt-1 text-xs text-muted-foreground">{item.slots}</p> : null}
                {item.bullets.length ? (
                  <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                    {item.bullets.map((b, j) => (
                      <li key={j}>• {b}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Collapse state for a list of cards, keyed by the card's client id.
 *  A card that already has a title and a price starts collapsed — on an edit
 *  page that turns a wall of open inputs back into a readable list — while a
 *  card the editor just added stays open, because it has nothing to show yet. */
export function useCollapsed(ids: number[], isComplete: (index: number) => boolean) {
  // Seeded once, on mount: afterwards the set is the editor's own state, so a
  // card doesn't snap shut the moment its last required field is filled in.
  const [collapsed, setCollapsed] = useState<Set<number>>(
    () => new Set(ids.filter((_, i) => isComplete(i))),
  );

  function toggle(id: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** A card added after mount must open, even though it isn't in the set —
   *  and one removed shouldn't leave its id behind. */
  function expand(id: number) {
    setCollapsed((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return { isCollapsed: (id: number) => collapsed.has(id), toggle, expand };
}

// ── trilingual name/benefits tabs (IA-44, 2026-08-05) ───────────────────────
// One switcher per row governs BOTH the title/name input (rides in the card's
// header) and the bullet list below it in the body — same hy/ru/en segmented
// control as the About block's per-locale tabs (project-form.tsx, sec-about),
// reproduced here rather than shared across modules: About's fields are
// uncontrolled refs (kept mounted for the autosave snapshot + Translate
// button), while a placement/tier row is plain controlled state, so a single
// input that swaps which locale field it's bound to is enough — nothing needs
// to stay mounted while hidden.

const OFFER_LANG_NAMES: Record<OfferLang, string> = { hy: "Հայերեն", ru: "Русский", en: "English" };

/** A locale tab counts as filled only once ITS OWN title/name AND its own
 *  bullet list have something in them — same all-or-nothing rule as the
 *  About block's dot (project-form.tsx recomputeAboutFilled). */
export function offerLocaleFilled(title: string, bullets: string): boolean {
  return !!title.trim() && bullets.split("\n").some((line) => line.trim());
}

/** Per-row "which locale tab is open", keyed by the row's client id (the same
 *  ids useSortableRows hands out) — UI-only, never serialized into the hidden
 *  JSON input. */
export function useOfferLangTabs() {
  const [active, setActive] = useState<Record<number, OfferLang>>({});
  return {
    activeFor: (id: number): OfferLang => active[id] ?? "hy",
    setActiveFor: (id: number, lang: OfferLang) => setActive((prev) => ({ ...prev, [id]: lang })),
  };
}

/** Sized to its labels, not the card width (owner request 2026-07-30, same
 *  reasoning as the About tabs and the video-source tabs above) — a 3-way
 *  pick has no business stretching across the card. */
export function OfferLangTabs({
  active,
  onChange,
  filled,
}: {
  active: OfferLang;
  onChange: (l: OfferLang) => void;
  filled: Record<OfferLang, boolean>;
}) {
  return (
    <div className="inline-flex w-fit gap-1 rounded-lg border border-border bg-background p-1">
      {OFFER_LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          // min-h-11 (44px): the project's touch-target convention (see
          // header.tsx's nav links) — the segmented control itself is
          // otherwise sized to its px-3/py-1.5 padding, which reads well but
          // falls short of that on its own.
          className={`inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            active === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              filled[l] ? "bg-success" : "border border-current opacity-50"
            }`}
          />
          {OFFER_LANG_NAMES[l]}
        </button>
      ))}
    </div>
  );
}
