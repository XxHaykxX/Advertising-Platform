"use client";

import { useActionState, useEffect } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPassword, type ResetState } from "@/app/forgot/actions";
import { makeUI, type Locale } from "@/lib/i18n";

export function ResetForm({ locale, token }: { locale: Locale; token: string }) {
  const t = makeUI(locale);
  const [state, formAction, pending] = useActionState<ResetState, FormData>(
    resetPassword,
    {},
  );

  // Navigate on the client with a fresh full request — same pattern as
  // /login/login-form.tsx.
  useEffect(() => {
    if (state.ok && state.redirect) {
      window.location.assign(state.redirect);
    }
  }, [state]);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="token" value={token} />

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">{t("auth.resetNewPassword")}</span>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <PasswordInput
            name="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            showLabel={t("auth.passwordShow")}
            hideLabel={t("auth.passwordHide")}
            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">{t("auth.resetConfirmPassword")}</span>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <PasswordInput
            name="passwordConfirm"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            showLabel={t("auth.passwordShow")}
            hideLabel={t("auth.passwordHide")}
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
        {t("auth.resetSubmit")}
      </Button>
    </form>
  );
}
