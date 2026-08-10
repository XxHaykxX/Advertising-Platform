"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { MediaField } from "@/components/media-field";
import { BulletListEditor } from "@/components/ui/bullet-list-editor";
import { ImageUploader } from "@/app/admin/(panel)/projects/image-uploader";
import { OFFER_LANGS, type OfferLang } from "@/app/admin/(panel)/projects/form-shared";
import { useUI, type Locale } from "@/lib/i18n-client";
import { AdSpaceOffersSection } from "./offers-editor";
import {
  EMPTY_AD_SPACE,
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

   Everything the brand eventually reads is per-locale, so title/description
   sit behind the same hy/ru/en tabs as the project form's About block, with
   all three panels mounted (only `hidden`) so nothing is dropped from the
   submit just because a tab wasn't open. */

const LANG_NAMES: Record<OfferLang, string> = { hy: "Հայերեն", ru: "Русский", en: "English" };

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary";
const labelCls = "mb-1.5 block text-sm font-medium text-foreground";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">{title}</h2>
      {children}
    </section>
  );
}

/** One channel option for the picker. Built on the server (every page that
 *  renders this form does it in two lines) rather than from AD_SPACE_CHANNELS
 *  here: the label needs `t("adChannel." + code)`, and a template-literal key
 *  in a client file is invisible to the client-dictionary scanner — the picker
 *  would show raw keys unless all 54 adChannel.* strings were shipped to the
 *  browser for the sake of seven names. */
export type AdSpaceChannelOption = { code: string; label: string };

export function AdSpaceForm({
  action,
  channels,
  initial,
  initialOffers = [],
  submitLabel,
  mode,
  locale,
  cancelHref,
}: {
  action: (prev: AdSpaceFormState, fd: FormData) => Promise<AdSpaceFormState>;
  channels: AdSpaceChannelOption[];
  initial?: AdSpaceFormValues;
  initialOffers?: AdSpaceOfferRow[];
  submitLabel: string;
  mode: "staff" | "creator";
  /** The member's own language. Ignored in staff mode — the admin panel is
   *  pinned to English, same as project-form and portfolio-form. */
  locale?: Locale;
  cancelHref: string;
}) {
  const t = useUI(mode === "staff" ? "en" : (locale ?? "hy"));
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
  // Bullet lists are controlled, so the descriptions live in state and reach
  // the server through hidden inputs (the title inputs stay uncontrolled).
  const [description, setDescription] = useState<Record<OfferLang, string>>({
    hy: data.descriptionHy,
    ru: data.descriptionRu,
    en: data.descriptionEn,
  });
  const [offers, setOffers] = useState<AdSpaceOfferRow[]>(initialOffers);

  return (
    <form action={formAction} className="max-w-3xl space-y-8">
      {/* The #AS-… code is generated server-side on create and re-asserted from
          storage on update — this mirror only keeps it visible in edit mode. */}
      <input type="hidden" name="code" value={data.code} />
      <input type="hidden" name="offersRows" value={JSON.stringify(offers)} />

      <Section title={t("adSpaceForm.section.general")}>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("adSpaceForm.city")}>
            <input name="city" defaultValue={data.city} className={inputCls} />
          </Field>
          <Field label={t("adSpaceForm.address")}>
            <input name="address" defaultValue={data.address} className={inputCls} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("adSpaceForm.sizeFormat")} hint={t("adSpaceForm.sizeFormatHint")}>
            <input name="sizeFormat" defaultValue={data.sizeFormat} className={inputCls} />
          </Field>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("adSpaceForm.availableFrom")} hint={t("adSpaceForm.availableHint")}>
            <input type="date" name="availableFrom" defaultValue={data.availableFrom} className={inputCls} />
          </Field>
          <Field label={t("adSpaceForm.availableTo")}>
            <input type="date" name="availableTo" defaultValue={data.availableTo} className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title={t("adSpaceForm.section.about")}>
        <div className="flex gap-1 rounded-xl border border-border bg-background p-1">
          {OFFER_LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setTab(l)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {LANG_NAMES[l]}
            </button>
          ))}
        </div>

        {OFFER_LANGS.map((l) => {
          const suffix = l === "hy" ? "Hy" : l === "ru" ? "Ru" : "En";
          const title = l === "hy" ? data.titleHy : l === "ru" ? data.titleRu : data.titleEn;
          return (
            <div key={l} className={tab === l ? "space-y-4" : "hidden"}>
              <Field label={t("adSpaceForm.title")}>
                <input name={`title${suffix}`} defaultValue={title} className={inputCls} />
              </Field>
              <div>
                <span className={labelCls}>{t("adSpaceForm.description")}</span>
                <input type="hidden" name={`description${suffix}`} value={description[l]} />
                <BulletListEditor
                  value={description[l]}
                  onChange={(v) => setDescription((prev) => ({ ...prev, [l]: v }))}
                  placeholder={t("projectForm.offer.bulletPlaceholder")}
                  addLabel={t("projectForm.offer.addBullet")}
                  removeLabel={t("projectForm.offer.removeBullet")}
                  moveUpLabel={t("projectForm.offer.moveUp")}
                  moveDownLabel={t("projectForm.offer.moveDown")}
                  emptyHint={t("projectForm.offer.bulletEmpty")}
                />
              </div>
            </div>
          );
        })}
      </Section>

      <Section title={t("adSpaceForm.section.media")}>
        <Field label={t("adSpaceForm.image")}>
          <MediaField
            name="image"
            initial={data.image}
            uploadDir="ad-spaces"
            scope={mode === "staff" ? "staff" : "member"}
            locale={mode === "staff" ? undefined : locale}
            label={t("btn.browse")}
            dropTitle={t("media.dropTitleOne")}
            dropLabel={t("media.dropHereOne")}
            errTooLargeLabel={t("media.errTooLargeShort")}
            replaceLabel={t("media.replace")}
            removeLabel={t("ui.remove")}
            dropReplaceLabel={t("media.dropToReplace")}
          />
        </Field>
        <Field label={t("adSpaceForm.gallery")}>
          <ImageUploader
            name="gallery"
            dir="ad-spaces"
            multiple
            initial={data.gallery}
            scope={mode === "staff" ? "staff" : "member"}
            pickerLocale={mode === "staff" ? undefined : locale}
            browseLabel={t("btn.browse")}
            dropTitle={t("media.dropTitleMany")}
            dropLabel={t("media.dropHere")}
            errTooLargeLabel={t("media.errTooLargeShort")}
            addLabel={t("media.addImage")}
            dropReplaceLabel={t("media.dropToReplace")}
            removeLabel={t("ui.remove")}
          />
        </Field>
      </Section>

      <Section title={t("adSpaceForm.section.offers")}>
        <AdSpaceOffersSection value={offers} onChange={setOffers} t={t} />
      </Section>

      {mode === "staff" ? (
        <Section title={t("adSpaceForm.section.visibility")}>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="isActive" defaultChecked={data.isActive} className="h-4 w-4" />
            {t("adSpaceForm.isActive")}
          </label>
        </Section>
      ) : (
        // The creator's counterpart of the Visibility block: the status is the
        // moderator's to set, so the form says what saving does instead of
        // offering a switch that would be ignored server-side.
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          {t("adSpaceForm.moderationNote")}
        </p>
      )}

      {state.error && (
        <p className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">
          {state.error}
        </p>
      )}

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
          {t("projectForm.cancel")}
        </Link>
      </div>
    </form>
  );
}
