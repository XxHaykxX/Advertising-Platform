"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPassword, type ResetState } from "@/app/forgot/actions";
import { useUI, type Locale } from "@/lib/i18n-client";
import {
  FIELD_ERROR_CLASS,
  FieldError,
  FieldErrorIcon,
  RequiredMark,
  focusFirstError,
  useRequiredFields,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

const REQUIRED = ["password", "passwordConfirm"] as const;
const inputClass =
  "w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary/50";

export function ResetForm({ locale, token }: { locale: Locale; token: string }) {
  const t = useUI(locale);
  const [state, formAction, pending] = useActionState<ResetState, FormData>(
    resetPassword,
    {},
  );

  // Controlled (not echoed via server state, unlike the email fields
  // elsewhere) so the passwords survive React's automatic form reset after a
  // failed submit (mismatch / too weak) without round-tripping plaintext
  // through the server action's returned state.
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const { errors, check, clear, fieldProps } = useRequiredFields(t("form.required"));

  // Navigate on the client with a fresh full request — same pattern as
  // /login/login-form.tsx.
  useEffect(() => {
    if (state.ok && state.redirect) {
      window.location.assign(state.redirect);
    }
  }, [state]);

  return (
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
      className="mt-8 space-y-5"
    >
      <input type="hidden" name="token" value={token} />

      <div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-foreground">
            {t("auth.resetNewPassword")}
            <RequiredMark />
          </span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <PasswordInput
              name="password"
              autoComplete="new-password"
              placeholder="••••••••"
              showLabel={t("auth.passwordShow")}
              hideLabel={t("auth.passwordHide")}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clear("password");
              }}
              {...fieldProps("password")}
              className={cn(inputClass, errors.password && FIELD_ERROR_CLASS)}
            />
            {/* Sits left of the show/hide eye, which owns the right edge. */}
            {errors.password && <FieldErrorIcon position="trailing-control" />}
          </div>
        </label>
        <FieldError id="password-error" message={errors.password} />
      </div>

      <div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-foreground">
            {t("auth.resetConfirmPassword")}
            <RequiredMark />
          </span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <PasswordInput
              name="passwordConfirm"
              autoComplete="new-password"
              placeholder="••••••••"
              showLabel={t("auth.passwordShow")}
              hideLabel={t("auth.passwordHide")}
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                clear("passwordConfirm");
              }}
              {...fieldProps("passwordConfirm")}
              className={cn(inputClass, errors.passwordConfirm && FIELD_ERROR_CLASS)}
            />
            {errors.passwordConfirm && <FieldErrorIcon position="trailing-control" />}
          </div>
        </label>
        <FieldError id="passwordConfirm-error" message={errors.passwordConfirm} />
      </div>

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
