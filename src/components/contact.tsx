"use client";

import { useActionState } from "react";
import { CheckCircle, Loader2, Send } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { submitLead, type LeadState } from "@/lib/actions/leads";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n-client";
import {
  FIELD_ERROR_CLASS,
  FieldError,
  FieldErrorIcon,
  RequiredMark,
  focusFirstError,
  useRequiredFields,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

const initialState: LeadState = { ok: false };

const REQUIRED = ["name", "email", "message"] as const;

const fieldClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-foreground";

export default function Contact({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = makeUI(locale);
  const [state, formAction, pending] = useActionState<LeadState, FormData>(
    submitLead,
    initialState,
  );
  const { errors, check, clear, fieldProps } = useRequiredFields(t("form.required"));

  return (
    <Section id="contact">
      <Container>
        <div className="mx-auto max-w-xl">
          <Reveal>
            <div className="mb-10 text-center">
              <h2 className="text-4xl font-bold md:text-5xl">{t("contact.title")}</h2>
              <p className="mt-3 text-muted-foreground">
                {t("contact.subtitle")}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            {state.ok ? (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center card-lift">
                <CheckCircle className="h-12 w-12 text-success" />
                <p className="text-lg font-semibold text-foreground">
                  {t("contact.thanks")}
                </p>
              </div>
            ) : (
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
                className="space-y-5 rounded-2xl border border-border bg-card p-8 card-lift"
              >
                <div>
                  <label className="block">
                    <span className={labelClass}>
                      {t("form.name")}
                      <RequiredMark />
                    </span>
                    <div className="relative">
                      <input
                        name="name"
                        type="text"
                        autoComplete="name"
                        defaultValue={state.values?.name}
                        placeholder={t("form.namePlaceholder")}
                        onInput={() => clear("name")}
                        {...fieldProps("name")}
                        className={cn(fieldClass, errors.name && FIELD_ERROR_CLASS)}
                      />
                      {errors.name && <FieldErrorIcon />}
                    </div>
                  </label>
                  <FieldError id="name-error" message={errors.name} />
                </div>

                <div>
                  <label className="block">
                    <span className={labelClass}>
                      {t("form.email")}
                      <RequiredMark />
                    </span>
                    <div className="relative">
                      <input
                        name="email"
                        type="email"
                        autoComplete="email"
                        defaultValue={state.values?.email}
                        placeholder="you@example.com"
                        onInput={() => clear("email")}
                        {...fieldProps("email")}
                        className={cn(fieldClass, errors.email && FIELD_ERROR_CLASS)}
                      />
                      {errors.email && <FieldErrorIcon />}
                    </div>
                  </label>
                  <FieldError id="email-error" message={errors.email} />
                </div>

                <div>
                  <label className="block">
                    <span className={labelClass}>
                      {t("form.message")}
                      <RequiredMark />
                    </span>
                    <div className="relative">
                      <textarea
                        name="message"
                        rows={5}
                        defaultValue={state.values?.message}
                        placeholder={t("contact.messagePlaceholder")}
                        onInput={() => clear("message")}
                        {...fieldProps("message")}
                        className={cn(fieldClass, "resize-none", errors.message && FIELD_ERROR_CLASS)}
                      />
                      {errors.message && <FieldErrorIcon position="textarea" />}
                    </div>
                  </label>
                  <FieldError id="message-error" message={errors.message} />
                </div>

                {state.error && (
                  <p className="text-sm text-danger">{state.error}</p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={pending}
                  className="w-full gap-2"
                >
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("btn.sending")}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {t("form.send")}
                    </>
                  )}
                </Button>
              </form>
            )}
          </Reveal>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("contact.emailDirectly")}{" "}
            <a href="mailto:hello@igovazd.am" className="text-primary hover:underline">
              hello@igovazd.am
            </a>
          </p>
        </div>
      </Container>
    </Section>
  );
}
