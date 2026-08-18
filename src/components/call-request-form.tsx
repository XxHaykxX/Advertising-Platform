"use client";

import { useActionState, useState } from "react";
import { CheckCircle, Loader2, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { submitCallRequest, type CallRequestState } from "@/lib/actions/call-request";
import { DEFAULT_LOCALE, useUI, type Locale } from "@/lib/i18n-client";
import { DEFAULT_DIAL_CODE, isValidPhone } from "@/lib/phone";
import {
  FIELD_ERROR_CLASS,
  FieldError,
  FieldErrorIcon,
  RequiredMark,
  focusFirstError,
  useRequiredFields,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

const initialState: CallRequestState = { ok: false };

// Phone is validated separately (isValidPhone), not through the FormData
// required-fields check below — a hidden input carries its value into the
// submit, but "non-empty" alone would let the untouched default dial code
// ("+374") through.
const REQUIRED = ["name"] as const;

const fieldClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-foreground";

export function CallRequestForm({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = useUI(locale);
  const [state, formAction, pending] = useActionState<CallRequestState, FormData>(
    submitCallRequest,
    initialState,
  );
  const { errors, check, clear, fieldProps } = useRequiredFields(t("form.required"));
  const [phone, setPhone] = useState(DEFAULT_DIAL_CODE);
  const [phoneError, setPhoneError] = useState(false);

  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center card-lift">
        <CheckCircle className="h-12 w-12 text-success" />
        <p className="text-lg font-semibold text-foreground">{t("callForm.thanksTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("callForm.thanksSubtitle")}</p>
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
        const nameOk = check(new FormData(form), REQUIRED);
        const phoneOk = isValidPhone(phone);
        setPhoneError(!phoneOk);
        if (!nameOk || !phoneOk) {
          e.preventDefault();
          if (!nameOk) focusFirstError(form, REQUIRED);
        }
      }}
      className="space-y-5 rounded-2xl border border-border bg-card p-8 card-lift"
    >
      {/* PhoneInput has no name of its own (see phone-input.tsx) — the hidden
          field is what actually reaches submitCallRequest's FormData. */}
      <input type="hidden" name="phone" value={phone} />

      <div>
        <label className="block">
          <span className={labelClass}>
            {t("callForm.name")}
            <RequiredMark />
          </span>
          <div className="relative">
            <input
              name="name"
              type="text"
              autoComplete="name"
              defaultValue={state.values?.name}
              placeholder={t("callForm.namePlaceholder")}
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
          {/* Same "whole frame lights up" treatment PhoneInput's own focus
              ring uses (globals.css .igv-phone) — the library gives us no hook
              to redden its internal border directly. */}
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
        <span className={labelClass}>{t("callForm.comment")}</span>
        <textarea
          name="comment"
          rows={3}
          defaultValue={state.values?.comment}
          placeholder={t("callForm.commentPlaceholder")}
          className={cn(fieldClass, "resize-none")}
        />
      </label>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full gap-2">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("btn.sending")}
          </>
        ) : (
          <>
            <PhoneCall className="h-4 w-4" />
            {t("btn.requestCall")}
          </>
        )}
      </Button>
    </form>
  );
}
