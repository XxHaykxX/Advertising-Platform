"use client";

import { useActionState } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { login, type LoginState } from "./actions";
import { GoogleButton } from "@/components/google-button";
import { makeUI, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LoginForm({
  locale,
  googleEnabled,
  notice,
}: {
  locale: Locale;
  googleEnabled?: boolean;
  notice?: string;
}) {
  const t = makeUI(locale);
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});
  const message = state.error ?? notice;

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

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">{t("login.password")}</span>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
          />
        </div>
      </label>

      {message && (
        <p className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">
          {message}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full gap-2">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("login.signIn")}
      </Button>
      </form>
    </>
  );
}
