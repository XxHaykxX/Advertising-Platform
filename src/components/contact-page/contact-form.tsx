"use client";

import { useActionState, useState } from "react";
import { CheckCircle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { submitLead, type LeadState } from "@/lib/actions/leads";
import { DEFAULT_LOCALE, useUI, type Locale } from "@/lib/i18n-client";
import { DEFAULT_DIAL_CODE, isValidPhone } from "@/lib/phone";
import type { ProjectListDTO } from "@/lib/types";
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

// Phone is checked separately (isValidPhone) rather than through this list,
// exactly as the callback form does it: a hidden input carries the value into
// the submit, but "non-empty" alone would wave the untouched "+374" through.
const REQUIRED = ["name", "message"] as const;

const fieldClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-foreground";

export function ContactForm({
  projects,
  locale = DEFAULT_LOCALE,
}: {
  projects: ProjectListDTO[];
  locale?: Locale;
}) {
  const t = useUI(locale);
  const [state, formAction, pending] = useActionState<LeadState, FormData>(
    submitLead,
    initialState,
  );
  const { errors, check, clear, fieldProps } = useRequiredFields(t("form.required"));
  const [phone, setPhone] = useState(DEFAULT_DIAL_CODE);
  const [phoneError, setPhoneError] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">{t("contactPage.formTitle")}</h2>
        <p className="text-muted-foreground">
          {t("contactPage.formSubtitle")}
        </p>
      </div>

      {state.ok ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center card-lift">
          <CheckCircle className="h-12 w-12 text-success" />
          <p className="text-lg font-semibold text-foreground">
            {t("contactPage.thanks")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("contactPage.thanksSubtitle")}
          </p>
        </div>
      ) : (
        <form
          action={formAction}
          // Own validation instead of the browser's: see field.tsx.
          noValidate
          onSubmit={(e) => {
            const form = e.currentTarget;
            const fieldsOk = check(new FormData(form), REQUIRED);
            const phoneOk = isValidPhone(phone);
            setPhoneError(!phoneOk);
            if (!fieldsOk || !phoneOk) {
              e.preventDefault();
              if (!fieldsOk) focusFirstError(form, REQUIRED);
            }
          }}
          className="space-y-5 rounded-2xl border border-border bg-card p-8 card-lift"
        >
          {/* PhoneInput has no name of its own (see phone-input.tsx) — this is
              what actually reaches submitLead's FormData. */}
          <input type="hidden" name="phone" value={phone} />

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
                {t("callForm.phone")}
                <RequiredMark />
              </span>
              {/* Same "whole frame lights up" treatment the callback form uses
                  — the library gives us no hook to redden its own border. */}
              <div className={cn("rounded-lg", phoneError && "ring-2 ring-danger/50")}>
                <PhoneInput
                  value={phone}
                  onChange={(next) => {
                    setPhone(next);
                    setPhoneError(false);
                  }}
                />
              </div>
            </label>
            <FieldError id="phone-error" message={phoneError ? t("formErr.phone") : undefined} />
          </div>

          <label className="block">
            <span className={labelClass}>{t("contactPage.projectOptional")}</span>
            <select
              name="projectTitle"
              className={fieldClass}
              defaultValue=""
            >
              <option value="">{t("contactPage.selectProject")}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.title}>
                  {project.title}
                </option>
              ))}
            </select>
          </label>

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
                  placeholder={t("contactPage.messagePlaceholder")}
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

          <p className="text-xs text-muted-foreground text-center">
            {t("contactPage.respondNote")}
          </p>
        </form>
      )}
    </div>
  );
}
