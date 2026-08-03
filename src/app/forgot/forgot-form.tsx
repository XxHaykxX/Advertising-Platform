"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestPasswordReset, type ForgotState } from "./actions";
import { makeUI, type Locale } from "@/lib/i18n-client";
import {
  FIELD_ERROR_CLASS,
  FieldError,
  FieldErrorIcon,
  RequiredMark,
  focusFirstError,
  useRequiredFields,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

const REQUIRED = ["email"] as const;
const inputClass =
  "w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary/50";

export function ForgotForm({ locale }: { locale: Locale }) {
  const t = makeUI(locale);
  const [state, formAction, pending] = useActionState<ForgotState, FormData>(
    requestPasswordReset,
    {},
  );
  const { errors, check, clear, fieldProps } = useRequiredFields(t("form.required"));

  if (state.ok) {
    return (
      <div className="mt-8 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-6 text-sm text-foreground">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
        {t("auth.forgotSent")}
      </div>
    );
  }

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
              // React's automatic form reset after a failed submit — same
              // pattern as /login/login-form.tsx.
              defaultValue={state.email ?? ""}
              onInput={() => clear("email")}
              {...fieldProps("email")}
              className={cn(inputClass, errors.email && FIELD_ERROR_CLASS)}
            />
            {errors.email && <FieldErrorIcon />}
          </div>
        </label>
        <FieldError id="email-error" message={errors.email} />
      </div>

      {state.error && (
        <p className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full gap-2">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("auth.forgotSubmit")}
      </Button>
    </form>
  );
}
