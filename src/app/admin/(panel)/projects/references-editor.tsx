"use client";

import { useState } from "react";
import Image from "next/image";
import { FileVideo, ImageIcon, Plus, Trash2, X } from "lucide-react";
import { MediaPicker, isVideoPath, type MediaPickerScope } from "@/components/media-picker";
import type { Locale, makeUI } from "@/lib/i18n";
import type { ReferenceRow } from "./form-shared";

// Controlled Reference Projects editor (admin redesign phase 2): a small
// repeatable list of { name, url, media } rows, mirrored by the parent
// ProjectForm into a hidden `references` input (JSON.stringify(rows)) and
// stored as-is in the `references` @db.Text column. Unlike
// ActorsSection/TiersSection, rows aren't drag-reorderable — order is just
// insertion order, and index is a safe React key since rows are only ever
// appended/removed, never shuffled.
//
// `media` (2026-07-26): a past project can now carry an uploaded image or
// video from the media library, not only an external link — the customer's CSV
// schema allowed either from the start, but the editor only ever offered the
// link. Both may be set: the link points at the source, the media is what gets
// shown.
export const EMPTY_REFERENCE: ReferenceRow = { name: "", url: "", media: "" };

const cellCls =
  "w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-card";

export function ReferencesSection({
  value,
  onChange,
  t,
  scope = "staff",
  locale,
}: {
  value: ReferenceRow[];
  onChange: (rows: ReferenceRow[]) => void;
  /** ProjectForm's own locale-aware translator (#15) — see ActorsSection's
   *  matching prop for the reasoning. */
  t: ReturnType<typeof makeUI>;
  /** "member" keeps a creator's uploads inside their own namespace, same as
   *  every other picker in this form. */
  scope?: MediaPickerScope;
  /** Language for the media dialog (audit 4.5). */
  locale?: Locale;
}) {
  // Which row's picker is open (index), or null.
  const [pickerFor, setPickerFor] = useState<number | null>(null);

  function update(i: number, patch: Partial<ReferenceRow>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    onChange([...value, { ...EMPTY_REFERENCE }]);
  }

  function removeRow(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("projectForm.referencesEmpty")}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden grid-cols-[1fr_1fr_120px_32px] items-center gap-2 border-b border-border bg-muted px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
            <span>{t("projectForm.field.referenceName")}</span>
            <span>{t("projectForm.field.referenceUrl")}</span>
            <span>{t("projectForm.field.referenceMedia")}</span>
            <span />
          </div>
          <div className="divide-y divide-border">
            {value.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_32px] items-center gap-x-2 gap-y-1 px-3 py-1.5 sm:grid-cols-[1fr_1fr_120px_32px]"
              >
                <input
                  value={r.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder={t("projectForm.field.referenceName")}
                  className={`${cellCls} col-start-1 row-start-1 sm:col-start-1`}
                />
                <input
                  value={r.url}
                  onChange={(e) => update(i, { url: e.target.value })}
                  placeholder={t("projectForm.field.referenceUrl")}
                  className={`${cellCls} col-span-2 col-start-1 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1`}
                />
                <div className="col-span-2 col-start-1 row-start-3 flex items-center gap-2 sm:col-span-1 sm:col-start-3 sm:row-start-1">
                  {r.media ? (
                    <>
                      <span className="relative h-9 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                        {isVideoPath(r.media) ? (
                          <span className="grid h-full w-full place-items-center text-muted-foreground">
                            <FileVideo className="h-4 w-4" />
                          </span>
                        ) : (
                          <Image src={r.media} alt="" fill className="object-cover" sizes="56px" unoptimized />
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => update(i, { media: "" })}
                        className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
                        aria-label={t("ui.remove")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPickerFor(i)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground hover:border-primary/40"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      {t("btn.browse")}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="col-start-2 row-start-1 grid h-8 w-8 place-items-center justify-self-end rounded-lg text-muted-foreground hover:bg-muted hover:text-primary sm:col-start-4"
                  aria-label={t("projectForm.remove")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
      >
        <Plus className="h-3.5 w-3.5" /> {t("projectForm.addReference")}
      </button>

      {/* One picker instance for the whole section, same pattern as
          ActorsSection's headshot picker. accept="any": a past project may be
          shown as a still or as a clip. */}
      <MediaPicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onSelect={(path) => {
          if (pickerFor !== null) update(pickerFor, { media: path });
        }}
        scope={scope}
        uploadDir="references"
        accept="any"
        locale={locale}
      />
    </div>
  );
}
