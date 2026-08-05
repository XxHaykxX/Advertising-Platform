"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaField } from "@/components/media-field";
import { MultiSelect } from "@/components/ui/multi-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { BRAND_CATEGORIES, BUDGET_RANGES } from "@/lib/brand-categories";
import { makeUI, useLocalizer, type Locale } from "@/lib/i18n-client";
import { updateBrandProfile, type BrandProfileFormState } from "../actions";
import type { BrandProfileDTO } from "@/lib/data/brand-profile";
import {
  FIELD_ERROR_CLASS,
  FieldError,
  FieldErrorIcon,
  RequiredMark,
  focusFirstError,
  useRequiredFields,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

const initialState: BrandProfileFormState = {};

// The action rejects a blank display name (../actions.ts) — flag it in the
// form instead of only after the round-trip, same as the creator's form.
const REQUIRED = ["name"] as const;

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50";
const labelClass = "mb-1.5 block text-sm font-semibold text-foreground";
const cardClass = "rounded-2xl border border-border bg-card p-6";

export function ProfileForm({ profile, locale }: { profile: BrandProfileDTO; locale: Locale }) {
  const t = makeUI(locale);
  // One hook call up front — BRAND_CATEGORIES.map() below calls this per
  // item; localizeValue() itself reads context and can't be called inside a
  // loop.
  const localize = useLocalizer(locale);
  const router = useRouter();
  const [state, formAction, actionPending] = useActionState<BrandProfileFormState, FormData>(
    updateBrandProfile,
    initialState,
  );
  const [transitionPending, startTransition] = useTransition();
  const pending = actionPending || transitionPending;

  // Submitted by hand rather than through <form action={formAction}> (IA-34).
  // React resets a form automatically once its `action` has run, which for one
  // frame puts every field back to the value the page was loaded with before
  // the controlled value is re-applied — the budget select visibly flashed the
  // previously saved option on every save (measured: one frame, ~17ms, on
  // three saves out of three). Dispatching the action ourselves skips that
  // reset. Nothing is lost by skipping it: every field here is controlled by
  // this component's own state, so there is no uncontrolled input relying on
  // the form being cleared.
  //
  // Same mechanism as IA-15 and its reopen, where the reset left the stale
  // value on screen for good rather than for a frame.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    // Own validation instead of the browser's (see field.tsx) — and it has to
    // run here rather than on a <form action={...}>, because this form
    // dispatches the action by hand for the anti-flash reason above.
    if (!check(data, REQUIRED)) {
      focusFirstError(form, REQUIRED);
      return;
    }
    startTransition(() => formAction(data));
  }
  const [categories, setCategories] = useState<string[]>(profile.brandCategories);
  // Controlled so the value survives React's automatic form reset after the
  // server action — an uncontrolled defaultValue reverts to the (stale) prop
  // until the page refreshes (IA-15).
  const [budgetRange, setBudgetRange] = useState(profile.budgetRange);
  const [phone, setPhone] = useState(profile.phone);
  // Controlled so a successful save can refresh it to the normalised value the
  // server actually stored (IA-35) — otherwise `\\example.com` keeps showing
  // verbatim after "Saved" even though the database holds
  // `https://example.com`. A failed save must leave what was typed alone, so
  // this is only ever written from the effect below, never reset on error.
  const [website, setWebsite] = useState(profile.website);
  // Transient "Saved" confirmation — auto-hides a few seconds after each save
  // instead of lingering forever (IA-28). Kept separate from `state.ok` (which
  // stays true) so it can be re-shown and re-timed on every consecutive save.
  const [showSaved, setShowSaved] = useState(false);
  const { errors, check, clear, fieldProps } = useRequiredFields(t("form.required"));
  const hasErrors = Object.keys(errors).length > 0;

  // After a successful save, pull the fresh server data so every consumer of
  // the profile (this select, the dashboard) reflects the new value without a
  // manual page reload (IA-15). Depend on the state OBJECT, not state.ok:
  // useActionState returns a new object per dispatch, while `ok` stays `true`
  // from the second consecutive save on — with [state.ok] the effect never
  // re-fired, the post-action form reset left the select showing its
  // page-load value, and the saved change looked lost (IA-15 reopen).
  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
    setShowSaved(true);
    // Reflect what the server actually stored — `website` is the one field
    // this action rewrites before saving it (IA-35); every other field here
    // round-trips unchanged, which is why only this one needs syncing back.
    if (state.website !== undefined) setWebsite(state.website ?? "");
    const id = setTimeout(() => setShowSaved(false), 2500);
    return () => clearTimeout(id);
  }, [state, router]);

  const categoryOptions = BRAND_CATEGORIES.map((c) => ({
    value: c,
    label: localize("category", c),
  }));

  return (
    <div className="mt-8 flex flex-col gap-6">
      {/* Account — email is read-only, outside the editable form */}
      <div className={cardClass}>
        <h2 className="text-lg font-semibold text-foreground">{t("account.brand.accountSection")}</h2>
        <label className="mt-4 block">
          <span className={labelClass}>{t("form.email")}</span>
          <input type="email" value={profile.email} readOnly disabled className={`${fieldClass} opacity-60`} />
          <span className="mt-1.5 block text-xs text-muted-foreground">{t("account.brand.emailReadonlyNote")}</span>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-foreground">{t("account.brand.companyDetails")}</h2>

          {/* Added 2026-08-05. The name was fetched by the page and rendered
              by nothing, so the one string creators and admins actually see —
              the "From" on every application, and the only identifier in the
              e-mail a creator receives — could not be corrected after
              registration. The logo had never existed on this side at all,
              while the creator's form has had an avatar since #23. */}
          <div className="mt-4 max-w-md">
            <label className="block">
              <span className={labelClass}>
                {t("form.name")}
                <RequiredMark />
              </span>
              <div className="relative">
                <input
                  name="name"
                  type="text"
                  defaultValue={profile.name}
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

          <div className="mt-4">
            <span className={labelClass}>{t("account.brand.logo")}</span>
            <p className="mb-2 text-xs text-muted-foreground">{t("account.brand.logoHint")}</p>
            {/* Member-scoped, exactly like the creator's avatar: uploads land
                in /uploads/members/<id>/avatars and the picker only ever shows
                this brand's own files. Every caption is localized — the
                component's English defaults would otherwise show through. */}
            <MediaField
              name="avatar"
              initial={profile.avatar}
              uploadDir="avatars"
              scope="member"
              label={t("btn.browse")}
              previewShape="square"
              dropTitle={t("media.dropTitleOne")}
              dropLabel={t("media.dropHereOne")}
              errTooLargeLabel={t("media.errTooLargeShort")}
              replaceLabel={t("media.replace")}
              removeLabel={t("ui.remove")}
              dropReplaceLabel={t("media.dropToReplace")}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>{t("form.company")}</span>
              <input
                name="company"
                type="text"
                defaultValue={profile.company}
                placeholder={t("form.companyPlaceholder")}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>{t("account.brand.website")}</span>
              <input
                name="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder={t("account.brand.websitePlaceholder")}
                className={fieldClass}
              />
            </label>
            <div className="block">
              <span className={labelClass}>{t("account.profile.phone")}</span>
              {/* The number the seller calls back on. It was only ever
                  collected by the application popup, so a brand had no way to
                  add or correct it here — and the popup then asked again on
                  every application. */}
              <PhoneInput value={phone} onChange={setPhone} />
              <input type="hidden" name="phone" value={phone} />
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-foreground">{t("account.brand.brandProfileSection")}</h2>

          <div className="mt-4">
            <span className={labelClass}>{t("account.brand.categories")}</span>
            <p className="mb-2 text-xs text-muted-foreground">{t("account.brand.categoriesHint")}</p>
            <MultiSelect
              options={categoryOptions}
              value={categories}
              onChange={setCategories}
              name="brandCategories"
              placeholder={t("account.brand.categories")}
              addLabel={t("ui.addOption")}
              removeLabel={t("ui.remove")}
            />
          </div>

          <label className="mt-4 block max-w-xs">
            <span className={labelClass}>{t("catalog.budgetRange")}</span>
            <select
              name="budgetRange"
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              className={fieldClass}
            >
              <option value="">{t("account.brand.budgetSelectPlaceholder")}</option>
              {BUDGET_RANGES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
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
          {/* Blocked submits never reach the action, so a stale "Saved" must
              not sit next to a red "please fill in this field". */}
          {showSaved && !pending && !hasErrors ? (
            <span className="text-sm font-medium text-success">{t("account.brand.saved")}</span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
