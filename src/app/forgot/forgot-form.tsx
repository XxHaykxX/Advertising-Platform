"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestPasswordReset, type ForgotState } from "./actions";
import { makeUI, type Locale } from "@/lib/i18n";

export function ForgotForm({ locale }: { locale: Locale }) {
  const t = makeUI(locale);
  const [state, formAction, pending] = useActionState<ForgotState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.ok) {
    return (
      <div className="mt-8 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-6 text-sm text-foreground">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
        {t("auth.forgotSent")}
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">{t("form.email")}</span>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder={t("login.emailPlaceholder")}
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
        {t("auth.forgotSubmit")}
      </Button>
    </form>
  );
}
