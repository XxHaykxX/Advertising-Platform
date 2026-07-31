"use client";

import { useState } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronDown, Eye, Plus } from "lucide-react";
import { groupDigits, withExclusive, withTotalSlots } from "./form-shared";
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
import type { makeUI, Locale } from "@/lib/i18n-client";

// Controlled sponsorship-tiers section (#20²) — the "Sponsors" block: the
// logo-on-materials deal, as opposed to the brand inside the story
// (placements-editor.tsx). Rows are owned by the parent ProjectForm, mirrored
// into a hidden `tiersRows` input, and persisted by createProject/updateProject
// in the same transaction (array order → sortOrder). benefits stays a
// newline-separated string in the UI; the server action converts it to a JSON
// string[] at rest.
//
// Redesigned 2026-07-29 alongside the placements editor: one card per package
// instead of a table row, sharing offer-card.tsx. A package also gained a still
// of its own (owner request — the block looked bare next to placements), which
// is why TierRow now carries `image`.
export type TierRow = {
  /** SponsorshipTier.id for a row that already exists in the DB; undefined for
   *  a row the editor just added. Saving used to delete every tier and
   *  re-insert the lot, which silently detached the brand applications that
   *  pointed at them (Interest.tierId → null on cascade) and dropped the slot
   *  a creator had already reserved. Carrying the id lets the save update in
   *  place instead. */
  dbId?: number;
  name: string;
  priceAmd: number;
  benefits: string;
  /** Still shown on top of the package card ("/uploads/…" or "" — unset).
   *  Optional, same as a placement's. */
  image: string;
  isExclusive: boolean;
  availableSlots: number | null;
  totalSlots: number | null;
};

/** A placement some other project already offers, ready to be added in one
 *  click. Built server-side in lib/data/tier-templates.ts. */
export type TierTemplate = { name: string; benefits: string; uses: number };

export const EMPTY_TIER: TierRow = {
  name: "",
  priceAmd: 0,
  benefits: "",
  image: "",
  isExclusive: false,
  availableSlots: null,
  totalSlots: null,
};

export function TiersSection({
  value,
  onChange,
  t,
  templates = [],
  scope = "staff",
  locale,
}: {
  value: TierRow[];
  onChange: (rows: TierRow[]) => void;
  /** ProjectForm's own locale-aware translator (#15) — see ActorsSection's
   *  matching prop for the reasoning. */
  t: ReturnType<typeof makeUI>;
  /** Packages already used on other projects, offered by the Add menu. */
  templates?: TierTemplate[];
  /** "member" keeps a creator's uploads inside their own namespace. */
  scope?: MediaPickerScope;
  locale?: Locale;
}) {
  const rows = useSortableRows(value, onChange);
  const { isCollapsed, toggle, expand } = useCollapsed(rows.ids, (i) => {
    const r = value[i];
    return !!r?.name.trim() && !!r?.benefits.trim();
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  function addRow(row: TierRow = EMPTY_TIER) {
    const id = rows.append({ ...row });
    expand(id);
  }

  // Price is never templated — see lib/data/tier-templates.ts.
  function addFromTemplate(tpl: TierTemplate) {
    addRow({ ...EMPTY_TIER, name: tpl.name, benefits: tpl.benefits });
    setMenuOpen(false);
  }

  /** Gold/Silver/Bronze differ by a price and a line or two, so copying beats
   *  retyping. The clone drops dbId — otherwise the save would update the
   *  source tier twice instead of inserting a new one. */
  function duplicateRow(i: number) {
    const src = value[i];
    const id = rows.insertAfter(i, {
      ...src,
      dbId: undefined,
      name: src.name ? `${src.name} (${t("projectForm.tiers.copySuffix")})` : "",
    });
    expand(id);
  }

  const priceLabel = (r: TierRow) => (r.priceAmd ? `${groupDigits(String(r.priceAmd))} AMD` : "");
  const slotsLabel = (r: TierRow) =>
    r.totalSlots != null && r.totalSlots > 0 ? `${r.availableSlots ?? 0} / ${r.totalSlots}` : "";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {value.length} {t(value.length === 1 ? "projectForm.tiers.tier" : "projectForm.tiers.tiers")}
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
          {/* Split button: the left half still adds a blank card, the chevron
              offers packages other projects already use — the names repeat, so
              retyping them (and their benefit lists) was the bulk of the work. */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => addRow()}
              className={`inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40 ${
                templates.length ? "rounded-l-lg border-r-0" : "rounded-lg"
              }`}
            >
              <Plus className="h-3.5 w-3.5" /> {t("projectForm.tiers.addTier")}
            </button>
            {templates.length ? (
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={t("projectForm.tiers.templates")}
                aria-expanded={menuOpen}
                className="inline-flex items-center rounded-r-lg border border-border px-1.5 py-1.5 text-foreground hover:border-primary/40"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            ) : null}
            {menuOpen ? (
              <>
                {/* Click-away catcher: a plain overlay beats a document listener
                    that would also have to know about the button that opened it. */}
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-72 overflow-hidden rounded-lg border border-border bg-card p-1 shadow-lg">
                  <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t("projectForm.tiers.templates")}
                  </p>
                  {templates.map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => addFromTemplate(tpl)}
                      className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-muted"
                    >
                      <span className="block text-xs font-medium text-foreground">{tpl.name}</span>
                      {tpl.benefits ? (
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {tpl.benefits.split("\n").filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("projectForm.tiers.empty")}</p>
      ) : (
        <OfferDndContext id="tier-rows" sensors={rows.sensors} onDragEnd={rows.handleDragEnd}>
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
                    title: r.name,
                    price: priceLabel(r),
                    slots: [slotsLabel(r), r.isExclusive ? t("projectForm.tiers.exclusive") : ""]
                      .filter(Boolean)
                      .join(" · "),
                  }}
                  header={
                    <OfferTitleInput
                      value={r.name}
                      onChange={(name) => rows.patchAt(i, { name })}
                      placeholder={t("projectForm.tiers.namePlaceholder")}
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
                        label={t("projectForm.tiers.image")}
                      />
                    }
                  >
                    <OfferNumbersRow>
                      <OfferPriceField
                        value={r.priceAmd}
                        onChange={(priceAmd) => rows.patchAt(i, { priceAmd: priceAmd ?? 0 })}
                        label={t("projectForm.tiers.price")}
                        t={t}
                      />
                      {/* Total is locked at 1 while Exclusive is on — the
                          checkbox owns the number, so leaving it editable would
                          only let the two contradict each other. */}
                      <OfferSlotsField
                        available={r.availableSlots}
                        total={r.totalSlots}
                        onAvailable={(availableSlots) => rows.patchAt(i, { availableSlots })}
                        onTotal={(totalSlots) => rows.replaceAt(i, withTotalSlots(r, totalSlots))}
                        totalDisabled={r.isExclusive}
                        totalTitle={r.isExclusive ? t("projectForm.tiers.exclusiveHint") : undefined}
                        t={t}
                      />
                    </OfferNumbersRow>
                    {/* Its own line: at this column width a third control on the
                        price/slots row pushed the slot boxes off to the right. */}
                    <label className="flex w-fit items-center gap-1.5 text-xs text-foreground">
                      <input
                        type="checkbox"
                        checked={r.isExclusive}
                        onChange={(e) => rows.replaceAt(i, withExclusive(r, e.target.checked))}
                        className="h-4 w-4 accent-primary"
                      />
                      {t("projectForm.tiers.exclusive")}
                    </label>
                    <OfferBullets
                      value={r.benefits}
                      onChange={(benefits) => rows.patchAt(i, { benefits })}
                      label={t("projectForm.tiers.benefits")}
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
          title: r.name,
          price: priceLabel(r),
          slots: slotsLabel(r) ? `${slotsLabel(r)} ${t("report.slotsAvailable")}` : "",
          bullets: r.benefits.split("\n").map((s) => s.trim()).filter(Boolean),
          badge: r.isExclusive ? t("report.exclusive") : undefined,
        }))}
      />
    </div>
  );
}
