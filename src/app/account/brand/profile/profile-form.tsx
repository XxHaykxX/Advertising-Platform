"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { BRAND_CATEGORIES, BUDGET_RANGES } from "@/lib/brand-categories";
import { localizeValue, makeUI, type Locale } from "@/lib/i18n";
import { updateBrandProfile, type BrandProfileFormState } from "../actions";
import type { BrandProfileDTO } from "@/lib/data/brand-profile";

const initialState: BrandProfileFormState = {};

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50";
const labelClass = "mb-1.5 block text-sm font-semibold text-foreground";
const cardClass = "rounded-2xl border border-border bg-card p-6";

export function ProfileForm({ profile, locale }: { profile: BrandProfileDTO; locale: Locale }) {
  const t = makeUI(locale);
  const router = useRouter();
  const [state, formAction, pending] = useActionState<BrandProfileFormState, FormData>(
    updateBrandProfile,
    initialState,
  );
  const [categories, setCategories] = useState<string[]>(profile.brandCategories);
  // Controlled so the value survives React's automatic form reset after the
  // server action — an uncontrolled defaultValue reverts to the (stale) prop
  // until the page refreshes (IA-15).
  const [budgetRange, setBudgetRange] = useState(profile.budgetRange);

  // After a successful save, pull the fresh server data so every consumer of
  // the profile (this select, the dashboard) reflects the new value without a
  // manual page reload (IA-15). Depend on the state OBJECT, not state.ok:
  // useActionState returns a new object per dispatch, while `ok` stays `true`
  // from the second consecutive save on — with [state.ok] the effect never
  // re-fired, the post-action form reset left the select showing its
  // page-load value, and the saved change looked lost (IA-15 reopen).
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  const categoryOptions = BRAND_CATEGORIES.map((c) => ({
    value: c,
    label: localizeValue(locale, "category", c),
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

      <form action={formAction} className="flex flex-col gap-6">
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-foreground">{t("account.brand.companyDetails")}</h2>
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
                defaultValue={profile.website}
                placeholder={t("account.brand.websitePlaceholder")}
                className={fieldClass}
              />
            </label>
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
          {state.ok && !pending ? (
            <span className="text-sm font-medium text-success">{t("account.brand.saved")}</span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
