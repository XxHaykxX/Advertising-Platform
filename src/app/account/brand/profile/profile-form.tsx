"use client";

import { useActionState, useState } from "react";
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
  const [state, formAction, pending] = useActionState<BrandProfileFormState, FormData>(
    updateBrandProfile,
    initialState,
  );
  const [categories, setCategories] = useState<string[]>(profile.brandCategories);

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
            />
          </div>

          <label className="mt-4 block max-w-xs">
            <span className={labelClass}>{t("catalog.budgetRange")}</span>
            <select name="budgetRange" defaultValue={profile.budgetRange} className={fieldClass}>
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
