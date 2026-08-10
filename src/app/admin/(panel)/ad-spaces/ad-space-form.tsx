"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Languages, Loader2 } from "lucide-react";
import { MediaField } from "@/components/media-field";
import { FormSectionNav } from "@/components/form-section-nav";
import { BulletListEditor } from "@/components/ui/bullet-list-editor";
import { MultiSelect } from "@/components/ui/multi-select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ImageUploader } from "@/app/admin/(panel)/projects/image-uploader";
import { OFFER_LANGS, type OfferLang } from "@/app/admin/(panel)/projects/form-shared";
import { localizeCity } from "@/lib/cities";
import { deleteCity } from "@/lib/actions/cities";
import { useUI, type Locale } from "@/lib/i18n-client";
import { AdSpaceOffersSection } from "./offers-editor";
import type { TranslateAdSpaceState } from "./translate-shared";
import {
  EMPTY_AD_SPACE,
  adSpacePublishBlockers,
  type AdSpaceFormState,
  type AdSpaceFormValues,
  type AdSpaceOfferRow,
} from "./form-shared";

/* One form for both zones (owner decision recorded in
   docs/plan-multichannel-ads.md, stage 3): staff open it at
   /admin/ad-spaces, a creator at /account/ad-spaces. What differs is the
   translator's locale (admin chrome is English-only, like every other admin
   form), the media scope, and the Visibility block — a creator never sets a
   status by hand, moderation does.

   ── Layout (rebuilt 2026-08-10, owner: "сделай как в Projects") ───────────
   The first version was a 768px single column with its own, larger, type and
   spacing scale: it read as a different product sitting inside the same admin
   panel, and the hy/ru/en switcher stretched edge to edge — the exact thing
   the project form was told to stop doing on 2026-07-30. This now borrows the
   project form's shell wholesale, because "consistent with the section next
   door" is worth more here than anything bespoke:

     · same 1400px cap, same main + 320px sidebar split
     · same input/label metrics (inputCls / labelCls, copied verbatim)
     · sticky Save bar with the unsaved-changes dot and a jump-to-section strip
     · language tabs sized to their labels, with a per-locale completeness dot
     · Translate (hy→ru/en), the same one-click pass a project gets
     · amber "still empty" marking on the two things that block publication

   The offers editor already shared the project's OfferCard, so it needed
   nothing. Everything above the fold is now the same muscle memory. */

const LANG_NAMES: Record<OfferLang, string> = { hy: "Հայերեն", ru: "Русский", en: "English" };

// Copied verbatim from project-form.tsx rather than imported: that module is a
// 2300-line client component and importing it for two strings would drag the
// whole thing into this bundle. Keep the two in step — they are the admin's
// field metrics.
const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary";
const labelCls = "mb-1 block text-xs font-medium text-foreground";

/** Ring + tint for something a publication still needs. Amber, never red: the
 *  field is incomplete, not wrong — same rule (and same non-token amber, for
 *  the 4.5:1 contrast floor) as the project form. */
const GAP_SHELL = "ring-1 ring-amber-400/70 bg-amber-50/50";

function PublishGapNote({ note }: { note: string }) {
  return (
    <p className="mt-1 flex items-start gap-1.5 text-xs font-medium text-amber-700">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {note}
    </p>
  );
}

/** NB: a <div>, NOT a <label> — the first version wrapped MediaField and
 *  ImageUploader in one, so a click on the caption or the empty space beside
 *  it popped the OS file picker open. See the same note in project-form.tsx. */
function Field({
  label,
  hint,
  anchorId,
  gapNote,
  children,
}: {
  label: string;
  hint?: string;
  /** Jump target for the section strip and the gap highlight. */
  anchorId?: string;
  /** Non-null when this field is one of the publication blockers and empty. */
  gapNote?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div
      id={anchorId}
      className={`block scroll-mt-28 rounded-lg ${gapNote ? `-mx-2 px-2 py-2 ${GAP_SHELL}` : ""}`}
    >
      <span className={labelCls}>{label}</span>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {gapNote && <PublishGapNote note={gapNote} />}
    </div>
  );
}

/** An upload zone with a heading a person can actually read (Field's label is
 *  11px) and one line saying WHERE the picture ends up. Mirrors MediaCard in
 *  the project form, added there for the same complaint: three identical drop
 *  zones with nothing to tell them apart. */
function MediaCard({ heading, hint, children }: { heading: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">{heading}</h3>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  );
}

/** Which anchor each publication blocker points at, so the amber shell, the
 *  warning dot on the section chip and the checklist all read from
 *  adSpacePublishBlockers instead of keeping their own idea of what's missing. */
const GAP_ANCHORS: Record<string, string> = {
  "adSpace.publish.offers": "sec-offers",
  "adSpace.publish.sizeFormat": "field-sizeFormat",
};

/** One channel option for the picker. Built on the server (every page that
 *  renders this form does it in two lines) rather than from AD_SPACE_CHANNELS
 *  here: the label needs `t("adChannel." + code)`, and a template-literal key
 *  in a client file is invisible to the client-dictionary scanner — the picker
 *  would show raw keys unless all 54 adChannel.* strings were shipped to the
 *  browser for the sake of seven names. */
export type AdSpaceChannelOption = { code: string; label: string };

export function AdSpaceForm({
  action,
  translateAction,
  channels,
  cityOptions: cityOptions0,
  initial,
  initialOffers = [],
  submitLabel,
  mode,
  locale,
  cancelHref,
}: {
  action: (prev: AdSpaceFormState, fd: FormData) => Promise<AdSpaceFormState>;
  /** hy→ru/en pass for the About block. Staff and creator pass their own
   *  gated action — see the note in ./translate-action.ts. */
  translateAction: (fd: FormData) => Promise<TranslateAdSpaceState>;
  channels: AdSpaceChannelOption[];
  /** The City dictionary's option list (#64) — same contract as
   *  project-form's countryOptions/studioOptions: a value typed in one ad
   *  space persists here for future ones, staff can prune it. */
  cityOptions: string[];
  initial?: AdSpaceFormValues;
  initialOffers?: AdSpaceOfferRow[];
  submitLabel: string;
  mode: "staff" | "creator";
  /** The member's own language. Ignored in staff mode — the admin panel is
   *  pinned to English, same as project-form and portfolio-form. */
  locale?: Locale;
  cancelHref: string;
}) {
  const formLocale: Locale = mode === "staff" ? "en" : (locale ?? "hy");
  const t = useUI(formLocale);
  const [state, formAction, pending] = useActionState<AdSpaceFormState, FormData>(action, {});

  // Full page load rather than the client router: a redirect() inside the
  // action gives a ChunkLoadError on prod, so the action returns the target
  // and the navigation happens here. Depends on `state`, not state.ok — two
  // successful saves in a row read identically otherwise.
  useEffect(() => {
    if (state.ok && state.redirect) window.location.assign(state.redirect);
  }, [state]);

  const data: AdSpaceFormValues = state.values ?? initial ?? EMPTY_AD_SPACE;

  const [tab, setTab] = useState<OfferLang>("hy");
  // Title and description are controlled: three short inputs and three bullet
  // lists, and having the values in state is what makes the completeness dots,
  // the Translate button and the publish-gap marking one-liners instead of a
  // ref registry.
  const [title, setTitle] = useState<Record<OfferLang, string>>({
    hy: data.titleHy,
    ru: data.titleRu,
    en: data.titleEn,
  });
  const [description, setDescription] = useState<Record<OfferLang, string>>({
    hy: data.descriptionHy,
    ru: data.descriptionRu,
    en: data.descriptionEn,
  });
  const [sizeFormat, setSizeFormat] = useState(data.sizeFormat);
  const [offers, setOffers] = useState<AdSpaceOfferRow[]>(initialOffers);
  const [dirty, setDirty] = useState(false);

  // ── City (#64) — same "picker over a growable dictionary" mechanic as
  // project-form's Country/Studio, just single-valued (an ad space has one
  // city). MultiSelect stays multi-valued under the hood; onChange below
  // collapses whatever it produces to its last entry so picking a new city
  // replaces the old one instead of adding to it.
  const [city, setCity] = useState(data.city);
  const [cityOptions, setCityOptions] = useState<string[]>(cityOptions0);
  const [deletingCityOption, setDeletingCityOption] = useState<string | null>(null);
  const [cityOptionPending, startCityOptionTransition] = useTransition();

  // ── Translate ────────────────────────────────────────────────────────────
  const [translating, startTranslate] = useTransition();
  const [translateError, setTranslateError] = useState<string | null>(null);

  function handleTranslate() {
    setTranslateError(null);
    const fd = new FormData();
    fd.set("sourceLang", tab);
    fd.set("title", title[tab]);
    fd.set("description", description[tab]);
    startTranslate(async () => {
      const res = await translateAction(fd);
      if (!res.ok || !res.values) {
        setTranslateError(res.errorCode ?? "genericError");
        return;
      }
      for (const [lang, v] of Object.entries(res.values)) {
        const l = lang as OfferLang;
        if (v.title) setTitle((prev) => ({ ...prev, [l]: v.title }));
        if (v.description) setDescription((prev) => ({ ...prev, [l]: v.description }));
      }
      setDirty(true);
    });
  }

  // ── What still blocks publication ────────────────────────────────────────
  // Same predicate the save, the submit and the moderator's approval run, so
  // the form can never disagree with the answer the server will give.
  const gaps = useMemo(() => {
    const anchors = new Set<string>();
    for (const key of adSpacePublishBlockers({ sizeFormat }, offers.length)) {
      const anchor = GAP_ANCHORS[key];
      if (anchor) anchors.add(anchor);
    }
    return anchors;
  }, [sizeFormat, offers.length]);

  const gapNote = (anchor: string) => (gaps.has(anchor) ? t("adSpaceForm.gapNote") : null);

  const SECTION_CLS = "scroll-mt-24 space-y-3 rounded-xl border p-4";
  const sectionCls = (anchor: string) =>
    gaps.has(anchor) ? `${SECTION_CLS} border-amber-300 ${GAP_SHELL}` : `${SECTION_CLS} border-border bg-card`;

  const navSections = [
    { id: "sec-about", label: t("adSpaceForm.section.about"), gap: false },
    { id: "sec-media", label: t("adSpaceForm.section.media"), gap: false },
    { id: "sec-offers", label: t("adSpaceForm.section.offers"), gap: gaps.has("sec-offers") },
    { id: "sec-general", label: t("adSpaceForm.section.general"), gap: gaps.has("field-sizeFormat") },
    ...(mode === "staff"
      ? [{ id: "sec-visibility", label: t("adSpaceForm.section.visibility"), gap: false }]
      : []),
  ];

  const filled = {
    hy: !!title.hy.trim(),
    ru: !!title.ru.trim(),
    en: !!title.en.trim(),
  };

  const uploaderScope = mode === "staff" ? "staff" : "member";
  const pickerLocale = mode === "staff" ? undefined : locale;

  return (
    <form
      action={formAction}
      onInput={() => setDirty(true)}
      // Width: the admin panel caps the form because its shell doesn't; in the
      // cabinet the cap lives on the shell (1600px), so a second one here would
      // only waste the difference. Same split as project-form.tsx.
      className={`space-y-4 ${mode === "creator" ? "[&_section]:scroll-mt-40" : "max-w-[1400px]"}`}
    >
      {/* The #AS-… code is generated server-side on create and re-asserted from
          storage on update — this mirror only keeps it visible in edit mode. */}
      <input type="hidden" name="code" value={data.code} />
      <input type="hidden" name="offersRows" value={JSON.stringify(offers)} />

      {/* ── Sticky Save bar ── pinned so Save is reachable without scrolling to
          the bottom. The offset differs by side because the chrome above it
          does: the admin panel has no site header on desktop, the cabinet sits
          under the 64px sticky one. */}
      <div
        className={`sticky -mx-4 flex flex-col gap-2 border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 md:-mx-10 md:px-10 ${
          mode === "creator" ? "top-16 z-30" : "top-14 z-20 md:top-0"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {dirty && !pending && (
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-danger">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
                {t("projectForm.unsavedChanges")}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={cancelHref}
              // min-h-11 under sm: on a phone this bar is the form's only
              // control surface, and 36px is short of the 44px a finger needs.
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:min-h-0"
            >
              {t("projectForm.leave")}
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-70 sm:min-h-0"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel}
            </button>
          </div>
        </div>

        <FormSectionNav sections={navSections} label={t("projectForm.sectionNav")} />
      </div>

      <div className="m-0 min-w-0 items-start gap-4 space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:space-y-0">
        {/* ══ Main column ══ */}
        <div className="min-w-0 space-y-4">
          {/* ── About ── per-locale title + description behind hy/ru/en tabs.
              All three panels stay MOUNTED (inactive ones are just `hidden`) so
              nothing is dropped from the submit because a tab wasn't open. */}
          <section id="sec-about" className={`${SECTION_CLS} border-border bg-card`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
                {t("adSpaceForm.section.about")}
              </h2>
              <button
                type="button"
                onClick={handleTranslate}
                disabled={translating}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary disabled:opacity-60"
              >
                {translating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Languages className="h-3.5 w-3.5" />
                )}
                {translating ? t("translate.working") : t("btn.translate")}
              </button>
            </div>
            {translateError && (
              <p className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
                {t("translate.error")}: {t(`translate.${translateError}`)}
              </p>
            )}

            {/* Sized to its labels, not to the form width — three flex-1
                segments stretched across the column was the owner's complaint
                about this form, and about the project form before it. The dot
                says whether that locale has a title, so a missing language
                shows without switching to it. */}
            <div className="inline-flex w-fit gap-1 rounded-lg border border-border bg-background p-1">
              {OFFER_LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setTab(l)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    tab === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      filled[l] ? "bg-success" : "border border-current opacity-50"
                    }`}
                  />
                  {LANG_NAMES[l]}
                </button>
              ))}
            </div>

            {OFFER_LANGS.map((l) => {
              const suffix = l === "hy" ? "Hy" : l === "ru" ? "Ru" : "En";
              return (
                <div key={l} className={tab === l ? "space-y-3" : "hidden"}>
                  <Field label={t("adSpaceForm.title")}>
                    <input
                      name={`title${suffix}`}
                      value={title[l]}
                      onChange={(e) => setTitle((prev) => ({ ...prev, [l]: e.target.value }))}
                      className={inputCls}
                    />
                  </Field>
                  <div>
                    <span className={labelCls}>{t("adSpaceForm.description")}</span>
                    {/* The bullet editor is controlled, so its value reaches the
                        server through this mirror. */}
                    <input type="hidden" name={`description${suffix}`} value={description[l]} />
                    <BulletListEditor
                      value={description[l]}
                      onChange={(v) => {
                        setDescription((prev) => ({ ...prev, [l]: v }));
                        setDirty(true);
                      }}
                      placeholder={t("projectForm.offer.bulletPlaceholder")}
                      addLabel={t("projectForm.offer.addBullet")}
                      removeLabel={t("projectForm.offer.removeBullet")}
                      moveUpLabel={t("projectForm.offer.moveUp")}
                      moveDownLabel={t("projectForm.offer.moveDown")}
                      emptyHint={t("adSpaceForm.descriptionEmpty")}
                    />
                  </div>
                </div>
              );
            })}
          </section>

          {/* ── Media ── */}
          <section id="sec-media" className={`${SECTION_CLS} border-border bg-card`}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              {t("adSpaceForm.section.media")}
            </h2>
            <div className="space-y-3">
              <MediaCard heading={t("adSpaceForm.image")} hint={t("adSpaceForm.imageHint")}>
                <MediaField
                  name="image"
                  initial={data.image}
                  uploadDir="ad-spaces"
                  scope={uploaderScope}
                  locale={pickerLocale}
                  label={t("btn.browse")}
                  dropTitle={t("media.dropTitleOne")}
                  dropLabel={t("media.dropHereOne")}
                  errTooLargeLabel={t("media.errTooLargeShort")}
                  replaceLabel={t("media.replace")}
                  removeLabel={t("ui.remove")}
                  dropReplaceLabel={t("media.dropToReplace")}
                />
              </MediaCard>
              <MediaCard heading={t("adSpaceForm.gallery")} hint={t("adSpaceForm.galleryHint")}>
                <ImageUploader
                  name="gallery"
                  dir="ad-spaces"
                  multiple
                  initial={data.gallery}
                  scope={uploaderScope}
                  pickerLocale={pickerLocale}
                  browseLabel={t("btn.browse")}
                  dropTitle={t("media.dropTitleMany")}
                  dropLabel={t("media.dropHere")}
                  errTooLargeLabel={t("media.errTooLargeShort")}
                  addLabel={t("media.addImage")}
                  dropReplaceLabel={t("media.dropToReplace")}
                  removeLabel={t("ui.remove")}
                />
              </MediaCard>
            </div>
          </section>

          {/* ── What a brand buys ── */}
          <section id="sec-offers" className={sectionCls("sec-offers")}>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
                {t("adSpaceForm.section.offers")}
              </h2>
              {gaps.has("sec-offers") && <PublishGapNote note={t("adSpaceForm.gapNote")} />}
            </div>
            <AdSpaceOffersSection value={offers} onChange={setOffers} t={t} />
          </section>
        </div>

        {/* ══ Meta sidebar ══ what the space IS, as opposed to how it reads.
            Same side and same width as the project form's General column. */}
        <div className="min-w-0 space-y-4 lg:sticky lg:top-32">
          <section id="sec-general" className={`${SECTION_CLS} border-border bg-card`}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              {t("adSpaceForm.section.general")}
            </h2>

            <Field label={t("adSpaceForm.channel")} hint={t("adSpaceForm.channelHint")}>
              <select name="channel" defaultValue={data.channel} className={inputCls}>
                <option value="">{t("adSpaceForm.channelNotSet")}</option>
                {channels.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t("adSpaceForm.city")}>
              <MultiSelect
                options={cityOptions.map((c) => ({ value: c, label: localizeCity(formLocale, c) }))}
                value={city ? [city] : []}
                onChange={(v) => setCity(v[v.length - 1] ?? "")}
                allowCustom
                placeholder={t("adSpaceForm.cityPlaceholder")}
                addLabel={t("ui.addOption")}
                removeLabel={t("ui.remove")}
                // Deleting is global — staff-only, same as Country/Studio.
                onDeleteOption={mode === "creator" ? undefined : (v) => setDeletingCityOption(v)}
              />
              {/* MultiSelect's own `name` prop would submit a JSON array;
                  `city` is a plain string column, so it rides along as its
                  own mirror instead — same trick description[l] uses above. */}
              <input type="hidden" name="city" value={city} />
            </Field>
            <Field label={t("adSpaceForm.address")}>
              <input name="address" defaultValue={data.address} className={inputCls} />
            </Field>

            <Field
              label={t("adSpaceForm.sizeFormat")}
              hint={t("adSpaceForm.sizeFormatHint")}
              anchorId="field-sizeFormat"
              gapNote={gapNote("field-sizeFormat")}
            >
              <input
                name="sizeFormat"
                value={sizeFormat}
                onChange={(e) => setSizeFormat(e.target.value)}
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("adSpaceForm.reachPerDay")}>
                <input
                  type="number"
                  min={0}
                  name="reachPerDay"
                  defaultValue={data.reachPerDay ?? ""}
                  className={inputCls}
                />
              </Field>
              <Field label={t("adSpaceForm.sides")}>
                <input type="number" min={0} name="sides" defaultValue={data.sides ?? ""} className={inputCls} />
              </Field>
            </div>

            <Field label={t("adSpaceForm.availableFrom")} hint={t("adSpaceForm.availableHint")}>
              <input type="date" name="availableFrom" defaultValue={data.availableFrom} className={inputCls} />
            </Field>
            <Field label={t("adSpaceForm.availableTo")}>
              <input type="date" name="availableTo" defaultValue={data.availableTo} className={inputCls} />
            </Field>
          </section>

          {mode === "staff" ? (
            <section id="sec-visibility" className={`${SECTION_CLS} border-border bg-card`}>
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
                {t("adSpaceForm.section.visibility")}
              </h2>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" name="isActive" defaultChecked={data.isActive} className="h-4 w-4" />
                {t("adSpaceForm.isActive")}
              </label>
            </section>
          ) : (
            // The creator's counterpart of the Visibility block: the status is
            // the moderator's to set, so the form says what saving does instead
            // of offering a switch that would be ignored server-side.
            <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              {t("adSpaceForm.moderationNote")}
            </p>
          )}
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">
          {state.error}
        </p>
      )}

      {/* Bottom pair, for the natural end-of-form flow — the sticky bar above
          carries the same two controls for everywhere else in the scroll. */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-70"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
        <Link href={cancelHref} className="text-sm text-muted-foreground hover:text-foreground">
          {t("projectForm.leave")}
        </Link>
      </div>

      {/* Removing a City value takes it away from every future ad space —
          same styled warning as project-form's Country/Studio dialogs. */}
      <ConfirmDialog
        open={deletingCityOption !== null}
        title={`Delete “${deletingCityOption ?? ""}” from the city list?`}
        message="It stops being offered on every future ad space. Spaces that already list it keep it."
        confirmLabel="Delete"
        pending={cityOptionPending}
        onCancel={() => setDeletingCityOption(null)}
        onConfirm={() => {
          const value = deletingCityOption;
          if (!value) return;
          startCityOptionTransition(async () => {
            await deleteCity(value);
            setCityOptions((opts) => opts.filter((x) => x !== value));
            if (city === value) setCity("");
            setDeletingCityOption(null);
          });
        }}
      />
    </form>
  );
}
