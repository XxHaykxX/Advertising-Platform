"use client";

import { useState } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Eye, Plus } from "lucide-react";
import {
  DEFAULT_PLACEMENT_SET,
  PLACEMENT_TYPE_VALUES,
  firstFilledLocale,
  groupDigits,
  type OfferLang,
} from "./form-shared";
import {
  OfferBullets,
  OfferCard,
  OfferCardBody,
  OfferDndContext,
  OfferField,
  OfferLangTabs,
  OfferNumbersRow,
  OfferPreviewDialog,
  OfferPriceField,
  OfferSlotsField,
  OfferStill,
  OfferTitleInput,
  fieldCls,
  offerLocaleFilled,
  useCollapsed,
  useOfferLangTabs,
  useSortableRows,
} from "./offer-card";
import type { MediaPickerScope } from "@/components/media-picker";
import type { useUI, Locale } from "@/lib/i18n-client";

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
  title: string; // legacy single-language value — kept as the fallback, see titleHy below
  // Per-locale title/description (IA-44, 2026-08-05). `title`/`description`
  // stay as the fallback every reader that hasn't been taught about the
  // locale trio yet still reads (including publishBlockers), and the server
  // mirrors them from these three on every save (form-shared.ts
  // firstFilledLocale) — so typing here never has to also touch `title`.
  titleHy: string;
  titleRu: string;
  titleEn: string;
  description: string; // legacy fallback, same story as `title`
  descriptionHy: string; // newline-separated in the UI; JSON string[] at rest, same convention as tier benefits
  descriptionRu: string;
  descriptionEn: string;
  image: string; // "/uploads/…" or "" — unset
  /** One of PLACEMENT_TYPE_VALUES, or "" for "not set" (2026-08-10). The
   *  column is nullable — an unclassified placement is a normal row — and ""
   *  is what the select's first option submits; the server maps it back to
   *  null (form-shared normalizePlacementType). */
  placementType: string;
  priceAmd: number | null; // null -> "on request"
  availableSlots: number | null;
  totalSlots: number | null;
};

export const EMPTY_PLACEMENT: PlacementRow = {
  title: "",
  titleHy: "",
  titleRu: "",
  titleEn: "",
  description: "",
  descriptionHy: "",
  descriptionRu: "",
  descriptionEn: "",
  image: "",
  placementType: "",
  priceAmd: null,
  availableSlots: null,
  totalSlots: null,
};

/** Read/write helpers for the locale-suffixed pair, so the header/body below
 *  can address "whichever tab is active" without a chain of ternaries at each
 *  call site — same `l === "hy" ? …Hy : l === "ru" ? …Ru : …En` shape as
 *  project-form.tsx's About block (ABOUT_LANGS.map), just factored out since
 *  each row needs it twice (title, description). */
function titleFor(r: PlacementRow, l: OfferLang): string {
  return l === "hy" ? r.titleHy : l === "ru" ? r.titleRu : r.titleEn;
}
function descriptionFor(r: PlacementRow, l: OfferLang): string {
  return l === "hy" ? r.descriptionHy : l === "ru" ? r.descriptionRu : r.descriptionEn;
}
function titlePatch(l: OfferLang, v: string): Partial<PlacementRow> {
  return l === "hy" ? { titleHy: v } : l === "ru" ? { titleRu: v } : { titleEn: v };
}
function descriptionPatch(l: OfferLang, v: string): Partial<PlacementRow> {
  return l === "hy" ? { descriptionHy: v } : l === "ru" ? { descriptionRu: v } : { descriptionEn: v };
}

/** Which of the four integration kinds this offer is (owner brief 2026-08-10).
 *  Optional, and stays optional: the four names are industry terms, so the
 *  picked one's meaning is spelled out right under the select rather than
 *  left for the creator to guess — "Naming rights" and "Verbal mention" are
 *  not self-explanatory to someone filling this form for the first time. */
function PlacementTypeField({
  value,
  onChange,
  t,
}: {
  value: string;
  onChange: (v: string) => void;
  t: ReturnType<typeof useUI>;
}) {
  const label = t("projectForm.placements.type");
  return (
    <OfferField label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={fieldCls}
      >
        <option value="">{t("projectForm.placements.typeNotSet")}</option>
        {PLACEMENT_TYPE_VALUES.map((v) => (
          <option key={v} value={v}>
            {t(`placementType.${v}`)}
          </option>
        ))}
      </select>
      {value ? (
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          {t(`placementTypeHint.${value}`)}
        </p>
      ) : null}
    </OfferField>
  );
}

export function PlacementsSection({
  value,
  onChange,
  t,
  scope = "staff",
  locale,
  showAddDefaultSet = false,
}: {
  value: PlacementRow[];
  onChange: (rows: PlacementRow[]) => void;
  /** ProjectForm's own locale-aware translator (#15) — see TiersSection's
   *  matching prop for the reasoning. */
  t: ReturnType<typeof useUI>;
  /** "member" keeps a creator's uploads inside their own namespace, same as
   *  every other picker in this form. */
  scope?: MediaPickerScope;
  /** Language for the media dialog (audit 4.5). */
  locale?: Locale;
  /** Offers the standard DEFAULT_PLACEMENT_SET as an "add what's missing"
   *  action (IA-44 §3) — edit mode only. A brand-new project already starts
   *  with the set (project-form.tsx), so there's nothing to add on create. */
  showAddDefaultSet?: boolean;
}) {
  const rows = useSortableRows(value, onChange);
  const { isCollapsed, toggle, expand } = useCollapsed(rows.ids, (i) => {
    const r = value[i];
    return !!firstFilledLocale({ hy: r?.titleHy, ru: r?.titleRu, en: r?.titleEn }).trim() && !!r?.image;
  });
  const { activeFor, setActiveFor } = useOfferLangTabs();
  const [previewing, setPreviewing] = useState(false);

  function addRow() {
    rows.append({ ...EMPTY_PLACEMENT });
  }

  /** Clone drops dbId — otherwise the save would update the source row twice
   *  instead of inserting a new one (see TiersSection.duplicateRow). The
   *  suffix is appended to every locale that actually has text, not just the
   *  legacy column. */
  function duplicateRow(i: number) {
    const src = value[i];
    const suffix = t("projectForm.placements.copySuffix");
    const withSuffix = (v: string) => (v ? `${v} (${suffix})` : "");
    const id = rows.insertAfter(i, {
      ...src,
      dbId: undefined,
      title: withSuffix(src.title),
      titleHy: withSuffix(src.titleHy),
      titleRu: withSuffix(src.titleRu),
      titleEn: withSuffix(src.titleEn),
    });
    expand(id);
  }

  /** Adds whichever DEFAULT_PLACEMENT_SET rows this project doesn't already
   *  have (IA-44 §3), matched by name across all three locales (trimmed,
   *  case-insensitive) so a project that already has "Advertising
   *  integration" in just one language doesn't get a near-duplicate row.
   *  Bypasses rows.append: appending the whole set in one onChange call keeps
   *  every row (calling append in a loop would have each call close over the
   *  same stale `value` and only the last row would survive). */
  function addDefaultSet() {
    const norm = (s: string) => s.trim().toLowerCase();
    const existing = new Set(
      value.flatMap((r) => [r.title, r.titleHy, r.titleRu, r.titleEn]).map(norm).filter(Boolean),
    );
    const missing = DEFAULT_PLACEMENT_SET.filter(
      (d) => !existing.has(norm(d.hy)) && !existing.has(norm(d.ru)) && !existing.has(norm(d.en)),
    );
    if (!missing.length) return;
    onChange([
      ...value,
      ...missing.map((d) => ({ ...EMPTY_PLACEMENT, title: d.hy, titleHy: d.hy, titleRu: d.ru, titleEn: d.en })),
    ]);
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
  // First-filled-locale (hy-first) — what the collapsed summary, the preview
  // dialog and the delete-confirm dialog show, so they never go blank just
  // because the editor's active tab happens to be the empty ru/en one.
  const displayTitle = (r: PlacementRow) =>
    firstFilledLocale({ hy: r.titleHy, ru: r.titleRu, en: r.titleEn }) || r.title;
  const displayDescription = (r: PlacementRow) =>
    firstFilledLocale({ hy: r.descriptionHy, ru: r.descriptionRu, en: r.descriptionEn }) || r.description;

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
          {showAddDefaultSet ? (
            <button
              type="button"
              onClick={addDefaultSet}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
            >
              <Plus className="h-3.5 w-3.5" /> {t("projectForm.offers.addDefaultSet")}
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
              {value.map((r, i) => {
                const lang = activeFor(rows.ids[i]);
                const filled = {
                  hy: offerLocaleFilled(r.titleHy, r.descriptionHy),
                  ru: offerLocaleFilled(r.titleRu, r.descriptionRu),
                  en: offerLocaleFilled(r.titleEn, r.descriptionEn),
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
                      title: displayTitle(r),
                      price: priceLabel(r),
                      slots: slotsLabel(r),
                    }}
                    header={
                      <div className="space-y-1.5">
                        {/* Own switcher per row — the editor fills one row at a
                            time, not every row in the same language, so this
                            can't be a single form-wide tab. Governs both the
                            title below AND the bullet list further down in the
                            body, which reads the same `lang`. */}
                        <OfferLangTabs active={lang} onChange={(l) => setActiveFor(rows.ids[i], l)} filled={filled} />
                        <OfferTitleInput
                          value={titleFor(r, lang)}
                          onChange={(v) => rows.patchAt(i, titlePatch(lang, v))}
                          placeholder={t("projectForm.placements.titlePlaceholder")}
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
                          label={t("projectForm.placements.image")}
                        />
                      }
                    >
                      <PlacementTypeField
                        value={r.placementType}
                        onChange={(placementType) => rows.patchAt(i, { placementType })}
                        t={t}
                      />
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
                        value={descriptionFor(r, lang)}
                        onChange={(v) => rows.patchAt(i, descriptionPatch(lang, v))}
                        label={t("projectForm.placements.description")}
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
          title: displayTitle(r),
          // The public card shows the kind as a chip next to the name, so the
          // preview does too — a preview that omits a field the site renders
          // is worse than no preview.
          badge: r.placementType ? t(`placementType.${r.placementType}`) : undefined,
          price: priceLabel(r),
          slots: slotsLabel(r) ? `${slotsLabel(r)} ${t("report.slotsAvailable")}` : "",
          bullets: displayDescription(r).split("\n").map((s) => s.trim()).filter(Boolean),
        }))}
      />
    </div>
  );
}
