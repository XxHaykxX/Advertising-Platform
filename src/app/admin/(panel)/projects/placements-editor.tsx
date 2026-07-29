"use client";

import { useState } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Eye, Plus } from "lucide-react";
import { groupDigits } from "./form-shared";
import {
  OfferBullets,
  OfferCard,
  OfferCardBody,
  OfferDndContext,
  OfferNumbersRow,
  OfferPreviewDialog,
  OfferPriceField,
  OfferSlotsField,
  OfferStill,
  OfferTitleInput,
  useCollapsed,
  useSortableRows,
} from "./offer-card";
import type { MediaPickerScope } from "@/components/media-picker";
import type { makeUI, Locale } from "@/lib/i18n";

// Controlled Product Placements section (owner correction 2026-07-28): the
// brand appearing INSIDE the story (a scene, a prop, the hero's car) — a
// separate thing from Sponsors (the logo-on-materials deal in
// tiers-editor.tsx), which it sits above in the form. Rows are owned by the
// parent ProjectForm, mirrored into a hidden `placementsRows` input, and
// persisted by create/updateProject in the same transaction as the project
// (array order → sortOrder). dbId is carried so a save updates a row in place
// instead of delete+reinsert — see TierRow.dbId for why that matters (it
// silently detached brand applications last time this shortcut was taken).
//
// Redesigned 2026-07-29 (owner: "заполнять это очень трудно и неудобно") from a
// spreadsheet row into one card per placement, shaped like the card the brand
// actually sees. The shared parts live in offer-card.tsx; the row type, the
// JSON mirror and the server contract are untouched.
export type PlacementRow = {
  /** Placement.id for a row that already exists in the DB; undefined for a
   *  row the editor just added — see TierRow.dbId in tiers-editor.tsx. */
  dbId?: number;
  title: string;
  description: string; // newline-separated in the UI; JSON string[] at rest, same convention as tier benefits
  image: string; // "/uploads/…" or "" — unset
  priceAmd: number | null; // null -> "on request"
  availableSlots: number | null;
  totalSlots: number | null;
};

export const EMPTY_PLACEMENT: PlacementRow = {
  title: "",
  description: "",
  image: "",
  priceAmd: null,
  availableSlots: null,
  totalSlots: null,
};

export function PlacementsSection({
  value,
  onChange,
  t,
  scope = "staff",
  locale,
}: {
  value: PlacementRow[];
  onChange: (rows: PlacementRow[]) => void;
  /** ProjectForm's own locale-aware translator (#15) — see TiersSection's
   *  matching prop for the reasoning. */
  t: ReturnType<typeof makeUI>;
  /** "member" keeps a creator's uploads inside their own namespace, same as
   *  every other picker in this form. */
  scope?: MediaPickerScope;
  /** Language for the media dialog (audit 4.5). */
  locale?: Locale;
}) {
  const rows = useSortableRows(value, onChange);
  const { isCollapsed, toggle, expand } = useCollapsed(rows.ids, (i) => {
    const r = value[i];
    return !!r?.title.trim() && !!r?.image;
  });
  const [previewing, setPreviewing] = useState(false);

  function addRow() {
    rows.append({ ...EMPTY_PLACEMENT });
  }

  /** Clone drops dbId — otherwise the save would update the source row twice
   *  instead of inserting a new one (see TiersSection.duplicateRow). */
  function duplicateRow(i: number) {
    const src = value[i];
    const id = rows.insertAfter(i, {
      ...src,
      dbId: undefined,
      title: src.title ? `${src.title} (${t("projectForm.placements.copySuffix")})` : "",
    });
    expand(id);
  }

  /** Typing Total also fills Available when the two haven't diverged yet — a
   *  fresh row always wants both equal (nothing sold). Same idea as
   *  form-shared's withTotalSlots, but inlined: that helper requires an
   *  `isExclusive` field placements don't have. */
  function onTotalSlots(i: number, totalSlots: number | null) {
    const r = value[i];
    const diverged = r.availableSlots !== null && r.availableSlots !== r.totalSlots;
    rows.patchAt(i, { totalSlots, availableSlots: diverged ? r.availableSlots : totalSlots });
  }

  const priceLabel = (r: PlacementRow) =>
    r.priceAmd == null ? t("projectForm.placements.priceOnRequest") : `${groupDigits(String(r.priceAmd))} AMD`;
  const slotsLabel = (r: PlacementRow) =>
    r.totalSlots != null && r.totalSlots > 0 ? `${r.availableSlots ?? 0} / ${r.totalSlots}` : "";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {value.length} {t(value.length === 1 ? "projectForm.placements.one" : "projectForm.placements.many")}
        </p>
        <div className="flex items-center gap-2">
          {value.length ? (
            <button
              type="button"
              onClick={() => setPreviewing(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
            >
              <Eye className="h-3.5 w-3.5" /> {t("projectForm.offer.preview")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
          >
            <Plus className="h-3.5 w-3.5" /> {t("projectForm.placements.add")}
          </button>
        </div>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("projectForm.placements.empty")}</p>
      ) : (
        <OfferDndContext id="placement-rows" sensors={rows.sensors} onDragEnd={rows.handleDragEnd}>
          <SortableContext items={rows.ids} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {value.map((r, i) => (
                <OfferCard
                  key={rows.ids[i]}
                  id={rows.ids[i]}
                  t={t}
                  collapsed={isCollapsed(rows.ids[i])}
                  onToggle={() => toggle(rows.ids[i])}
                  onDuplicate={() => duplicateRow(i)}
                  onDelete={() => rows.removeAt(i)}
                  summary={{
                    image: r.image,
                    title: r.title,
                    price: priceLabel(r),
                    slots: slotsLabel(r),
                  }}
                  header={
                    <OfferTitleInput
                      value={r.title}
                      onChange={(title) => rows.patchAt(i, { title })}
                      placeholder={t("projectForm.placements.titlePlaceholder")}
                    />
                  }
                >
                  <OfferCardBody
                    still={
                      <OfferStill
                        value={r.image}
                        onChange={(image) => rows.patchAt(i, { image })}
                        t={t}
                        scope={scope}
                        locale={locale}
                        label={t("projectForm.placements.image")}
                      />
                    }
                  >
                    <OfferNumbersRow>
                      <OfferPriceField
                        value={r.priceAmd}
                        onChange={(priceAmd) => rows.patchAt(i, { priceAmd })}
                        label={t("projectForm.placements.price")}
                        t={t}
                        allowOnRequest
                      />
                      <OfferSlotsField
                        available={r.availableSlots}
                        total={r.totalSlots}
                        onAvailable={(availableSlots) => rows.patchAt(i, { availableSlots })}
                        onTotal={(totalSlots) => onTotalSlots(i, totalSlots)}
                        t={t}
                      />
                    </OfferNumbersRow>
                    <OfferBullets
                      value={r.description}
                      onChange={(description) => rows.patchAt(i, { description })}
                      label={t("projectForm.placements.description")}
                      t={t}
                    />
                  </OfferCardBody>
                </OfferCard>
              ))}
            </div>
          </SortableContext>
        </OfferDndContext>
      )}

      <OfferPreviewDialog
        open={previewing}
        onClose={() => setPreviewing(false)}
        title={t("projectForm.offer.preview")}
        t={t}
        items={value.map((r) => ({
          image: r.image,
          title: r.title,
          price: priceLabel(r),
          slots: slotsLabel(r) ? `${slotsLabel(r)} ${t("report.slotsAvailable")}` : "",
          bullets: r.description.split("\n").map((s) => s.trim()).filter(Boolean),
        }))}
      />
    </div>
  );
}
