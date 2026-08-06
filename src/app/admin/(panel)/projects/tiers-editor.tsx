"use client";

import { useState } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronDown, Eye, Plus } from "lucide-react";
import {
  DEFAULT_TIER_SET,
  firstFilledLocale,
  groupDigits,
  withExclusive,
  withTotalSlots,
  type OfferLang,
} from "./form-shared";
import {
  OfferBullets,
  OfferCard,
  OfferCardBody,
  OfferDndContext,
  OfferLangTabs,
  OfferNumbersRow,
  OfferPreviewDialog,
  OfferPriceField,
  OfferSlotsField,
  OfferStill,
  OfferTitleInput,
  offerLocaleFilled,
  useCollapsed,
  useOfferLangTabs,
  useSortableRows,
} from "./offer-card";
import type { MediaPickerScope } from "@/components/media-picker";
import type { useUI, Locale } from "@/lib/i18n-client";

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
  name: string; // legacy single-language value — kept as the fallback, see nameHy below
  // Per-locale name/benefits (IA-44, 2026-08-05). `name`/`benefits` stay as
  // the fallback every reader that hasn't been taught about the locale trio
  // yet still reads (including publishBlockers), and the server mirrors them
  // from these three on every save (form-shared.ts firstFilledLocale) — so
  // typing here never has to also touch `name`.
  nameHy: string;
  nameRu: string;
  nameEn: string;
  priceAmd: number | null; // null -> "on request" (2026-08-04, same contract as PlacementRow.priceAmd)
  benefits: string; // legacy fallback, same story as `name`
  benefitsHy: string;
  benefitsRu: string;
  benefitsEn: string;
  /** Still shown on top of the package card ("/uploads/…" or "" — unset).
   *  Optional, same as a placement's. */
  image: string;
  isExclusive: boolean;
  availableSlots: number | null;
  totalSlots: number | null;
};

/** A placement some other project already offers, ready to be added in one
 *  click. Built server-side in lib/data/tier-templates.ts. Templates stay
 *  legacy-only (mergeTierTemplates in form-shared.ts groups by the plain
 *  `name`/`benefits` column, not the locale trio) — addFromTemplate below
 *  seeds the hy tab from it, same "legacy value shows in hy" rule as an
 *  existing row loaded without locale data yet. */
export type TierTemplate = { name: string; benefits: string; uses: number };

export const EMPTY_TIER: TierRow = {
  name: "",
  nameHy: "",
  nameRu: "",
  nameEn: "",
  priceAmd: null,
  benefits: "",
  benefitsHy: "",
  benefitsRu: "",
  benefitsEn: "",
  image: "",
  isExclusive: false,
  availableSlots: null,
  totalSlots: null,
};

/** Same read/write-by-active-locale helpers as placements-editor.tsx. */
function nameFor(r: TierRow, l: OfferLang): string {
  return l === "hy" ? r.nameHy : l === "ru" ? r.nameRu : r.nameEn;
}
function benefitsFor(r: TierRow, l: OfferLang): string {
  return l === "hy" ? r.benefitsHy : l === "ru" ? r.benefitsRu : r.benefitsEn;
}
function namePatch(l: OfferLang, v: string): Partial<TierRow> {
  return l === "hy" ? { nameHy: v } : l === "ru" ? { nameRu: v } : { nameEn: v };
}
function benefitsPatch(l: OfferLang, v: string): Partial<TierRow> {
  return l === "hy" ? { benefitsHy: v } : l === "ru" ? { benefitsRu: v } : { benefitsEn: v };
}

export function TiersSection({
  value,
  onChange,
  t,
  templates = [],
  scope = "staff",
  locale,
  showAddDefaultSet = false,
}: {
  value: TierRow[];
  onChange: (rows: TierRow[]) => void;
  /** ProjectForm's own locale-aware translator (#15) — see ActorsSection's
   *  matching prop for the reasoning. */
  t: ReturnType<typeof useUI>;
  /** Packages already used on other projects, offered by the Add menu. */
  templates?: TierTemplate[];
  /** "member" keeps a creator's uploads inside their own namespace. */
  scope?: MediaPickerScope;
  locale?: Locale;
  /** Offers the standard DEFAULT_TIER_SET as an "add what's missing" action
   *  (IA-44 §3) — edit mode only, see PlacementsSection's matching prop. */
  showAddDefaultSet?: boolean;
}) {
  const rows = useSortableRows(value, onChange);
  const { isCollapsed, toggle, expand } = useCollapsed(rows.ids, (i) => {
    const r = value[i];
    return (
      !!firstFilledLocale({ hy: r?.nameHy, ru: r?.nameRu, en: r?.nameEn }).trim() &&
      !!firstFilledLocale({ hy: r?.benefitsHy, ru: r?.benefitsRu, en: r?.benefitsEn }).trim()
    );
  });
  const { activeFor, setActiveFor } = useOfferLangTabs();
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  function addRow(row: TierRow = EMPTY_TIER) {
    const id = rows.append({ ...row });
    expand(id);
  }

  // Price is never templated — see lib/data/tier-templates.ts. Templates only
  // ever carry the legacy name/benefits (see TierTemplate's doc comment
  // above), so the hy tab is seeded from them the same way a pre-existing row
  // with no locale data yet would be.
  function addFromTemplate(tpl: TierTemplate) {
    addRow({ ...EMPTY_TIER, name: tpl.name, nameHy: tpl.name, benefits: tpl.benefits, benefitsHy: tpl.benefits });
    setMenuOpen(false);
  }

  /** Gold/Silver/Bronze differ by a price and a line or two, so copying beats
   *  retyping. The clone drops dbId — otherwise the save would update the
   *  source tier twice instead of inserting a new one. The suffix is
   *  appended to every locale that actually has text, not just the legacy
   *  column. */
  function duplicateRow(i: number) {
    const src = value[i];
    const suffix = t("projectForm.tiers.copySuffix");
    const withSuffix = (v: string) => (v ? `${v} (${suffix})` : "");
    const id = rows.insertAfter(i, {
      ...src,
      dbId: undefined,
      name: withSuffix(src.name),
      nameHy: withSuffix(src.nameHy),
      nameRu: withSuffix(src.nameRu),
      nameEn: withSuffix(src.nameEn),
    });
    expand(id);
  }

  /** Adds whichever DEFAULT_TIER_SET rows this project doesn't already have
   *  (IA-44 §3) — same name-across-all-locales dedup as
   *  PlacementsSection.addDefaultSet, and same reason for bypassing
   *  rows.append (a loop of appends would drop all but the last row). */
  function addDefaultSet() {
    const norm = (s: string) => s.trim().toLowerCase();
    const existing = new Set(
      value.flatMap((r) => [r.name, r.nameHy, r.nameRu, r.nameEn]).map(norm).filter(Boolean),
    );
    const missing = DEFAULT_TIER_SET.filter(
      (d) => !existing.has(norm(d.hy)) && !existing.has(norm(d.ru)) && !existing.has(norm(d.en)),
    );
    if (!missing.length) return;
    onChange([
      ...value,
      ...missing.map((d) => ({ ...EMPTY_TIER, name: d.hy, nameHy: d.hy, nameRu: d.ru, nameEn: d.en })),
    ]);
  }

  const priceLabel = (r: TierRow) =>
    r.priceAmd == null ? t("projectForm.placements.priceOnRequest") : `${groupDigits(String(r.priceAmd))} AMD`;
  const slotsLabel = (r: TierRow) =>
    r.totalSlots != null && r.totalSlots > 0 ? `${r.availableSlots ?? 0} / ${r.totalSlots}` : "";
  // First-filled-locale (hy-first) — what the collapsed summary, the preview
  // dialog and the delete-confirm dialog show, so they never go blank just
  // because the editor's active tab happens to be the empty ru/en one.
  const displayName = (r: TierRow) => firstFilledLocale({ hy: r.nameHy, ru: r.nameRu, en: r.nameEn }) || r.name;
  const displayBenefits = (r: TierRow) =>
    firstFilledLocale({ hy: r.benefitsHy, ru: r.benefitsRu, en: r.benefitsEn }) || r.benefits;

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
          {showAddDefaultSet ? (
            <button
              type="button"
              onClick={addDefaultSet}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
            >
              <Plus className="h-3.5 w-3.5" /> {t("projectForm.offers.addDefaultSet")}
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
              {value.map((r, i) => {
                const lang = activeFor(rows.ids[i]);
                const filled = {
                  hy: offerLocaleFilled(r.nameHy, r.benefitsHy),
                  ru: offerLocaleFilled(r.nameRu, r.benefitsRu),
                  en: offerLocaleFilled(r.nameEn, r.benefitsEn),
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
                    summary={{
                      image: r.image,
                      title: displayName(r),
                      price: priceLabel(r),
                      slots: [slotsLabel(r), r.isExclusive ? t("projectForm.tiers.exclusive") : ""]
                        .filter(Boolean)
                        .join(" · "),
                    }}
                    header={
                      <div className="space-y-1.5">
                        {/* Own switcher per row — same reasoning as
                            PlacementsSection's. Governs both the name below
                            AND the benefits list further down in the body. */}
                        <OfferLangTabs active={lang} onChange={(l) => setActiveFor(rows.ids[i], l)} filled={filled} />
                        <OfferTitleInput
                          value={nameFor(r, lang)}
                          onChange={(v) => rows.patchAt(i, namePatch(lang, v))}
                          placeholder={t("projectForm.tiers.namePlaceholder")}
                        />
                      </div>
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
                          onChange={(priceAmd) => rows.patchAt(i, { priceAmd })}
                          label={t("projectForm.tiers.price")}
                          t={t}
                          allowOnRequest
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
                        value={benefitsFor(r, lang)}
                        onChange={(v) => rows.patchAt(i, benefitsPatch(lang, v))}
                        label={t("projectForm.tiers.benefits")}
                        t={t}
                      />
                    </OfferCardBody>
                  </OfferCard>
                );
              })}
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
          title: displayName(r),
          price: priceLabel(r),
          slots: slotsLabel(r) ? `${slotsLabel(r)} ${t("report.slotsAvailable")}` : "",
          bullets: displayBenefits(r).split("\n").map((s) => s.trim()).filter(Boolean),
          badge: r.isExclusive ? t("report.exclusive") : undefined,
        }))}
      />
    </div>
  );
}
