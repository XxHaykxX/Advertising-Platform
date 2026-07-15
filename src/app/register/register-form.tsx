"use client";

import { useActionState, useEffect, useState } from "react";
import { Building2, Loader2, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { register, type RegisterState } from "./actions";
import { GoogleButton } from "@/components/google-button";
import { makeUI, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { PasswordInput } from "@/components/ui/password-input";

export function RegisterForm({ locale, googleEnabled }: { locale: Locale; googleEnabled?: boolean }) {
  const t = makeUI(locale);
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(register, {});
  const [type, setType] = useState<"brand" | "creator">("brand");

  // Registration signs the member in immediately (no moderation queue) and
  // reports success + a destination instead of redirecting server-side: the
  // session cookie was just set in this action, so navigating from the
  // client with a fresh full request is what carries it past the auth gate.
  useEffect(() => {
    if (state.ok && state.redirect) {
      window.location.assign(state.redirect);
    }
  }, [state]);

  if (state.ok) {
    return (
      <div className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center text-sm font-medium text-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("auth.redirecting")}
      </div>
    );
  }

  return (
    <>
      {googleEnabled && (
        <div className="mt-8 space-y-4">
          <GoogleButton label={t("auth.googleContinue")} />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("auth.or")}
            <span className="h-px flex-1 bg-border" />
          </div>
        </div>
      )}
      <form action={formAction} className={cn("space-y-5", googleEnabled ? "mt-4" : "mt-8")}>
      <input type="hidden" name="type" value={type} />

      <div>
        <span className="mb-1.5 block text-sm font-semibold text-foreground">
          {t("register.accountType")}
        </span>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setType("brand")}
            className={cn(
              "rounded-xl border p-3 text-left transition-colors",
              type === "brand"
                ? "border-primary bg-primary/10"
                : "border-border bg-background hover:border-primary/40"
            )}
          >
            <span className="block text-sm font-semibold text-foreground">
              {t("register.typeBrand")}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {t("register.typeBrandHint")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setType("creator")}
            className={cn(
              "rounded-xl border p-3 text-left transition-colors",
              type === "creator"
                ? "border-primary bg-primary/10"
                : "border-border bg-background hover:border-primary/40"
            )}
          >
            <span className="block text-sm font-semibold text-foreground">
              {t("register.typeCreator")}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {t("register.typeCreatorHint")}
            </span>
          </button>
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">{t("register.fullName")}</span>
        <div className="relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="name"
            type="text"
            required
            placeholder={t("register.fullNamePlaceholder")}
            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">{t("register.workEmail")}</span>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="email"
            type="email"
            required
            placeholder={type === "brand" ? t("register.emailPlaceholderBrand") : t("register.emailPlaceholderCreator")}
            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">{t("register.password")}</span>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <PasswordInput
            name="password"
            required
            autoComplete="new-password"
            placeholder={t("register.passwordPlaceholder")}
            showLabel={t("auth.passwordShow")}
            hideLabel={t("auth.passwordHide")}
            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">
          {type === "brand" ? t("form.company") : t("register.creatorOrg")}
        </span>
        <div className="relative">
          <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="company"
            type="text"
            placeholder={type === "brand" ? t("register.companyPlaceholder") : t("register.creatorOrgPlaceholder")}
            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
          />
        </div>
      </label>

      {state.error && (
        <p className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full gap-2">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("register.submit")}
      </Button>
      </form>
    </>
  );
}
