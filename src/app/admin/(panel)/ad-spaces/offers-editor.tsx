"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { firstFilledLocale, groupDigits, type OfferLang } from "@/app/admin/(panel)/projects/form-shared";
import {
  OfferCard,
  OfferDndContext,
  OfferField,
  OfferLangTabs,
  OfferNumbersRow,
  OfferPriceField,
  OfferSlotsField,
  OfferTitleInput,
  fieldCls,
  useCollapsed,
  useOfferLangTabs,
  useSortableRows,
} from "@/app/admin/(panel)/projects/offer-card";
import { EMPTY_AD_SPACE_OFFER, type AdSpaceOfferRow } from "./form-shared";
import type { useUI } from "@/lib/i18n-client";

/* What a brand buys on an ad space. The same card, the same drag handle and
   the same price/slots controls as the placement editor — this is the placement
   card minus the still and the bullet list (an AdSpaceOffer has neither
   column), plus the "period" the price buys. Rows are owned by the parent form
   and mirrored into its hidden `offersRows` input. */

function nameFor(r: AdSpaceOfferRow, l: OfferLang): string {
  return l === "hy" ? r.nameHy : l === "ru" ? r.nameRu : r.nameEn;
}
function namePatch(l: OfferLang, v: string): Partial<AdSpaceOfferRow> {
  return l === "hy" ? { nameHy: v } : l === "ru" ? { nameRu: v } : { nameEn: v };
}
function periodFor(r: AdSpaceOfferRow, l: OfferLang): string {
  return l === "hy" ? r.periodHy : l === "ru" ? r.periodRu : r.periodEn;
}
function periodPatch(l: OfferLang, v: string): Partial<AdSpaceOfferRow> {
  return l === "hy" ? { periodHy: v } : l === "ru" ? { periodRu: v } : { periodEn: v };
}

export function AdSpaceOffersSection({
  value,
  onChange,
  t,
}: {
  value: AdSpaceOfferRow[];
  onChange: (rows: AdSpaceOfferRow[]) => void;
  t: ReturnType<typeof useUI>;
}) {
  const rows = useSortableRows(value, onChange);
  const { isCollapsed, toggle, expand } = useCollapsed(rows.ids, (i) => {
    const r = value[i];
    return !!firstFilledLocale({ hy: r?.nameHy, ru: r?.nameRu, en: r?.nameEn }).trim();
  });
  const { activeFor, setActiveFor } = useOfferLangTabs();

  /** Clone drops dbId — otherwise the save would update the source row twice
   *  instead of inserting a new one. */
  function duplicateRow(i: number) {
    const src = value[i];
    const suffix = t("projectForm.placements.copySuffix");
    const withSuffix = (v: string) => (v ? `${v} (${suffix})` : "");
    const id = rows.insertAfter(i, {
      ...src,
      dbId: undefined,
      nameHy: withSuffix(src.nameHy),
      nameRu: withSuffix(src.nameRu),
      nameEn: withSuffix(src.nameEn),
    });
    expand(id);
  }

  /** Typing Total also fills Available while the two haven't diverged — a fresh
   *  row always wants both equal (nothing sold). Same rule as the placement
   *  editor's onTotalSlots. */
  function onTotalSlots(i: number, totalSlots: number | null) {
    const r = value[i];
    const diverged = r.availableSlots !== null && r.availableSlots !== r.totalSlots;
    rows.patchAt(i, { totalSlots, availableSlots: diverged ? r.availableSlots : totalSlots });
  }

  const priceLabel = (r: AdSpaceOfferRow) =>
    r.priceAmd == null ? t("projectForm.placements.priceOnRequest") : `${groupDigits(String(r.priceAmd))} AMD`;
  const slotsLabel = (r: AdSpaceOfferRow) =>
    r.totalSlots != null && r.totalSlots > 0 ? `${r.availableSlots ?? 0} / ${r.totalSlots}` : "";
  const displayName = (r: AdSpaceOfferRow) => firstFilledLocale({ hy: r.nameHy, ru: r.nameRu, en: r.nameEn });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {value.length} {t(value.length === 1 ? "adSpaceForm.offers.one" : "adSpaceForm.offers.many")}
        </p>
        <button
          type="button"
          onClick={() => rows.append({ ...EMPTY_AD_SPACE_OFFER })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
        >
          <Plus className="h-3.5 w-3.5" /> {t("adSpaceForm.offers.add")}
        </button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("adSpaceForm.offers.empty")}</p>
      ) : (
        <OfferDndContext id="ad-space-offer-rows" sensors={rows.sensors} onDragEnd={rows.handleDragEnd}>
          <SortableContext items={rows.ids} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {value.map((r, i) => {
                const lang = activeFor(rows.ids[i]);
                // An offer has no bullet list, so a locale counts as filled on
                // its name alone (offerLocaleFilled's all-or-nothing rule needs
                // the second field this row doesn't have).
                const filled = {
                  hy: !!r.nameHy.trim(),
                  ru: !!r.nameRu.trim(),
                  en: !!r.nameEn.trim(),
                };
                return (
                  <OfferCard
                    key={rows.ids[i]}
                    id={rows.ids[i]}
                    t={t}
                    collapsed={isCollapsed(rows.ids[i])}
                    onToggle={() => toggle(rows.ids[i])}
                    onDuplicate={() => duplicateRow(i)}
                    onDelete={() => rows.removeAt(i)}
                    hideThumb
                    summary={{
                      image: "",
                      title: displayName(r),
                      price: priceLabel(r),
                      slots: slotsLabel(r),
                    }}
                    header={
                      <div className="space-y-1.5">
                        <OfferLangTabs
                          active={lang}
                          onChange={(l) => setActiveFor(rows.ids[i], l)}
                          filled={filled}
                        />
                        <OfferTitleInput
                          value={nameFor(r, lang)}
                          onChange={(v) => rows.patchAt(i, namePatch(lang, v))}
                          placeholder={t("adSpaceForm.offers.namePlaceholder")}
                        />
                      </div>
                    }
                  >
                    <div className="space-y-2.5">
                      <OfferField label={t("adSpaceForm.offers.period")}>
                        <input
                          value={periodFor(r, lang)}
                          onChange={(e) => rows.patchAt(i, periodPatch(lang, e.target.value))}
                          placeholder={t("adSpaceForm.offers.periodPlaceholder")}
                          aria-label={t("adSpaceForm.offers.period")}
                          className={fieldCls}
                        />
                      </OfferField>
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
                    </div>
                  </OfferCard>
                );
              })}
            </div>
          </SortableContext>
        </OfferDndContext>
      )}
    </div>
  );
}
