"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaField } from "@/components/media-field";
import { PhoneInput } from "@/components/ui/phone-input";
import { useUI, type Locale } from "@/lib/i18n-client";
import { updateCreatorProfile, type CreatorProfileFormState } from "../../actions";
import {
  FIELD_ERROR_CLASS,
  FieldError,
  FieldErrorIcon,
  RequiredMark,
  focusFirstError,
  useRequiredFields,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

const initialState: CreatorProfileFormState = {};

// The action rejects a blank display name (account/actions.ts) — flag it in
// the form instead of only after the round-trip.
const REQUIRED = ["name"] as const;

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50";
const labelClass = "mb-1.5 block text-sm font-semibold text-foreground";
const cardClass = "rounded-2xl border border-border bg-card p-6";

/** CREATOR "My Profile" form — display name + avatar. Avatar goes through the
 *  member-scoped MediaField (uploads land in /uploads/members/<id>/avatars and
 *  the picker only shows the creator's own files). Email is read-only. */
export function ProfileForm({
  name,
  email,
  avatar,
  phone,
  website,
  locale,
}: {
  name: string;
  email: string;
  avatar: string;
  phone: string;
  website: string;
  locale: Locale;
}) {
  const t = useUI(locale);
  const [phoneValue, setPhoneValue] = useState(phone);
  // Controlled so a successful save can refresh it to the normalised value
  // the server actually stored (IA-35, mirrors the brand profile form) —
  // otherwise `\\example.com` keeps showing verbatim after "Saved" even
  // though the database holds `https://example.com`. A failed save must
  // leave what was typed alone, so this is only ever written by the effect
  // below, never reset on error.
  const [websiteValue, setWebsiteValue] = useState(website);
  const [state, formAction, pending] = useActionState<CreatorProfileFormState, FormData>(
    updateCreatorProfile,
    initialState,
  );
  const { errors, check, clear, fieldProps } = useRequiredFields(t("form.required"));
  const hasErrors = Object.keys(errors).length > 0;

  // Reflect what the server actually stored. Adjusted during render rather
  // than from an effect, keyed on the action result object so it runs once per
  // submit — the same trigger the effect had.
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    if (state.ok && state.website !== undefined) setWebsiteValue(state.website ?? "");
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <form
        action={formAction}
        // Own validation instead of the browser's: see field.tsx.
        noValidate
        onSubmit={(e) => {
          const form = e.currentTarget;
          if (!check(new FormData(form), REQUIRED)) {
            e.preventDefault();
            focusFirstError(form, REQUIRED);
          }
        }}
        className="flex flex-col gap-6"
      >
        {/* One card, in the order a profile is read: who you are (picture +
            name), how to reach you, and last the account's own fixed data.
            The avatar used to be a full-width drop zone in the middle of the
            fields — ~300px of chrome for a 96px picture (2026-08-07). */}
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-foreground">{t("account.profile")}</h2>

          <div className="mt-4">
            <span className={labelClass}>{t("account.profile.avatar")}</span>
            {/* Member-facing, so every caption is localized — the component's
                English defaults would otherwise show through here. */}
            <MediaField
              name="avatar"
              initial={avatar}
              uploadDir="avatars"
              scope="member"
              label={t("btn.browse")}
              previewShape="avatar"
              // Square crop up front: the picture is shown in a circle
              // everywhere (header menu, poster logo), and an uncropped
              // landscape photo lost its sides there with no way to choose
              // which sides.
              cropAspect={1}
              cropLabels={{
                title: t("media.crop.title"),
                zoom: t("media.crop.zoom"),
                apply: t("media.crop.apply"),
                cancel: t("media.crop.cancel"),
                hint: t("media.crop.hint"),
              }}
              locale={locale}
              dropTitle={t("media.dropTitleOne")}
              dropLabel={t("media.dropHereOne")}
              errTooLargeLabel={t("media.errTooLargeShort")}
              errTooSmallLabel={t("media.errTooSmall")}
              replaceLabel={t("media.replace")}
              removeLabel={t("ui.remove")}
              dropReplaceLabel={t("media.dropToReplace")}
            />
            <p className="mt-2 text-xs text-muted-foreground">{t("account.profile.avatarHint")}</p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="block">
              <label className="block">
                <span className={labelClass}>
                  {t("form.name")}
                  <RequiredMark />
                </span>
                <div className="relative">
                  <input
                    name="name"
                    type="text"
                    defaultValue={name}
                    placeholder={t("form.name")}
                    onInput={() => clear("name")}
                    {...fieldProps("name")}
                    className={cn(fieldClass, errors.name && FIELD_ERROR_CLASS)}
                  />
                  {errors.name && <FieldErrorIcon />}
                </div>
              </label>
              <FieldError id="name-error" message={errors.name} />
            </div>

            <div className="block">
              <span className={labelClass}>{t("account.profile.phone")}</span>
              {/* Country picker with the flag and dial code (2026-07-29). The
                  visible field is controlled by the component, so the value the
                  action reads travels in a hidden input — always E.164, never
                  the masked string with spaces in it. */}
              <PhoneInput value={phoneValue} onChange={setPhoneValue} />
              <input type="hidden" name="phone" value={phoneValue} />
            </div>

            <label className="block">
              <span className={labelClass}>{t("account.profile.website")}</span>
              <input
                name="website"
                type="url"
                value={websiteValue}
                onChange={(e) => setWebsiteValue(e.target.value)}
                placeholder={t("account.profile.website")}
                className={fieldClass}
              />
            </label>

            {/* Read-only, and inside the card rather than in one of its own:
                it belongs to the same "who you are" block, it just can't be
                edited here. */}
            <label className="block">
              <span className={labelClass}>{t("form.email")}</span>
              <input type="email" value={email} readOnly disabled className={`${fieldClass} opacity-60`} />
              <span className="mt-1.5 block text-xs text-muted-foreground">
                {t("account.brand.emailReadonlyNote")}
              </span>
            </label>
          </div>
        </div>

        {state.error && (
          <p className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">
            {state.error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" size="lg" disabled={pending} className="gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("account.brand.saveChanges")}
          </Button>
          {/* Blocked submits never reach the action, so `state.ok` still holds
              the previous save — without this the green "Saved" would sit next
              to a red "please fill in this field" from the attempt just made. */}
          {state.ok && !pending && !hasErrors ? (
            <span className="text-sm font-medium text-success">{t("account.brand.saved")}</span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
