"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { login, type LoginState } from "./actions";
import { GoogleButton } from "@/components/google-button";
import { useUI, type Locale } from "@/lib/i18n-client";
import { cn } from "@/lib/utils";
import { PasswordInput } from "@/components/ui/password-input";
import {
  FIELD_ERROR_CLASS,
  FieldError,
  FieldErrorIcon,
  FormError,
  RequiredMark,
  focusFirstError,
  useRequiredFields,
  useSubmitError,
} from "@/components/ui/field";

const REQUIRED = ["email", "password"] as const;
const inputClass =
  "w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary/50";

export function LoginForm({
  locale,
  googleEnabled,
  notice,
  from,
}: {
  locale: Locale;
  googleEnabled?: boolean;
  notice?: string;
  /** Audit 4.3: the page a guest was bounced from (proxy sets ?from= — see
   *  proxy.ts) — round-tripped through a hidden field so actions.ts can send
   *  the member back there instead of always to the cabinet. Re-validated
   *  server-side; this component just carries it along. */
  from?: string;
}) {
  const t = useUI(locale);
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});
  // IA-56: a rejected sign-in blames the pair of fields, so both get outlined
  // — but only for the action's own error. `notice` comes from a ?status=
  // redirect (blocked / pending / Google failure) and arrives with the fields
  // empty, so there is nothing to point at.
  const { error: authError, dismiss } = useSubmitError(state, state.error);
  const message = authError ?? notice;

  // Controlled (not echoed via server state, unlike the email field above)
  // so a failed submit can clear it below — React's automatic reset of an
  // uncontrolled input skips onChange, leaving PasswordInput's eye toggle
  // stuck enabled on a field that looks empty (IA-4).
  const [password, setPassword] = useState("");
  const { errors, check, clear, fieldProps } = useRequiredFields(t("form.required"));

  // Navigate on the client with a fresh full request, so the just-set
  // session cookie is carried and the auth gate sees it (see actions.ts).
  useEffect(() => {
    if (state.ok && state.redirect) {
      window.location.assign(state.redirect);
    }
  }, [state]);

  // IA-4: wipe the password on a failed submit so the field is genuinely
  // empty and PasswordInput's eye toggle auto-disables. Done during render,
  // keyed on the action result object, so the field is already empty in the
  // commit that shows the error.
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    if (!state.ok && state.error) setPassword("");
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
        className={cn("space-y-5", googleEnabled ? "mt-4" : "mt-8")}
      >
      {from && <input type="hidden" name="from" value={from} />}
      <div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-foreground">
            {t("form.email")}
            <RequiredMark />
          </span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="email"
              type="email"
              autoComplete="username"
              placeholder={t("login.emailPlaceholder")}
              // Echoed back from the server action's state so it survives
              // React's automatic form reset after a failed submit (the
              // action re-renders with the submitted email in `state`, so the
              // reset picks up this defaultValue instead of clearing to "").
              defaultValue={state.email ?? ""}
              onInput={() => {
                clear("email");
                dismiss();
              }}
              {...fieldProps("email")}
              className={cn(inputClass, (errors.email || authError) && FIELD_ERROR_CLASS)}
            />
            {errors.email && <FieldErrorIcon />}
          </div>
        </label>
        <FieldError id="email-error" message={errors.email} />
      </div>

      <div>
        <label className="block">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {t("login.password")}
              <RequiredMark />
            </span>
            <Link href="/forgot" className="text-xs font-medium text-primary hover:underline">
              {t("auth.forgotLink")}
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <PasswordInput
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              showLabel={t("auth.passwordShow")}
              hideLabel={t("auth.passwordHide")}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clear("password");
                dismiss();
              }}
              {...fieldProps("password")}
              className={cn(inputClass, (errors.password || authError) && FIELD_ERROR_CLASS)}
            />
            {/* Sits left of the show/hide eye, which owns the right edge. */}
            {errors.password && <FieldErrorIcon position="trailing-control" />}
          </div>
        </label>
        <FieldError id="password-error" message={errors.password} />
      </div>

      <FormError message={message} />

      <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full gap-2">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("login.signIn")}
      </Button>
      </form>
    </>
  );
}
