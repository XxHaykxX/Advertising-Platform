"use client";

import { useActionState, useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeRegister, type CompleteState } from "./actions";
import { makeUI, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function CompleteForm({
  locale,
  name,
  email,
}: {
  locale: Locale;
  name: string;
  email: string;
}) {
  const t = makeUI(locale);
  const [state, formAction, pending] = useActionState<CompleteState, FormData>(completeRegister, {});
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
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="type" value={type} />

      <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
        <span className="font-semibold text-foreground">{name}</span>
        <span className="ml-2 text-muted-foreground">{email}</span>
      </div>

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
                : "border-border bg-background hover:border-primary/40",
            )}
          >
            <span className="block text-sm font-semibold text-foreground">{t("register.typeBrand")}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{t("register.typeBrandHint")}</span>
          </button>
          <button
            type="button"
            onClick={() => setType("creator")}
            className={cn(
              "rounded-xl border p-3 text-left transition-colors",
              type === "creator"
                ? "border-primary bg-primary/10"
                : "border-border bg-background hover:border-primary/40",
            )}
          >
            <span className="block text-sm font-semibold text-foreground">{t("register.typeCreator")}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{t("register.typeCreatorHint")}</span>
          </button>
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">{t("form.company")}</span>
        <div className="relative">
          <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="company"
            type="text"
            placeholder={t("register.companyPlaceholder")}
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
  );
}
