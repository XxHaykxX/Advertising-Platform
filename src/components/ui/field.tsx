"use client";

import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared "this field is required" treatment, asked for by the content editor
 *  on 2026-08-03: an asterisk next to every mandatory label, and — once a
 *  submit is attempted with the field left empty — a red outline, a red (!)
 *  at the end of the row and a one-line message underneath.
 *
 *  It deliberately replaces the browser's own `required` popup: that popup is
 *  rendered in the browser's UI language, so an Armenian visitor on an English
 *  Chrome was told "Please fill out this field" in English, in a bubble we
 *  can't style. Every form using this passes `noValidate` and calls
 *  `useRequiredFields().check()` before letting its action run. */

/** Red asterisk that marks a label as mandatory. Decorative — the message
 *  under the field is what a screen reader announces (via aria-describedby). */
export function RequiredMark() {
  return (
    <span aria-hidden className="ms-0.5 text-danger">
      *
    </span>
  );
}

/** The message under an invalid field. Renders nothing when the field is fine,
 *  so it can be dropped into a form unconditionally.
 *
 *  Keep it OUTSIDE the wrapping <label>: everything inside a label becomes part
 *  of the control's accessible name, so a screen reader would read
 *  "Email Please fill in this field" as the field's name and then repeat the
 *  message again from aria-describedby. */
export function FieldError({
  id,
  message,
  className,
}: {
  id?: string;
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p id={id} className={cn("mt-1.5 text-xs text-danger", className)}>
      {message}
    </p>
  );
}

/** The red (!) that sits at the end of an invalid row. Absolutely positioned —
 *  the caller wraps the control in `relative`. `position` shifts it off a
 *  control that already owns its right edge (the password show/hide toggle) or
 *  pins it to the top of a multi-line textarea instead of its centre. */
export function FieldErrorIcon({
  position = "inline",
  className,
}: {
  position?: "inline" | "trailing-control" | "textarea";
  className?: string;
}) {
  return (
    <CircleAlert
      aria-hidden
      className={cn(
        "pointer-events-none absolute h-4 w-4 text-danger",
        position === "textarea"
          ? "right-3.5 top-3.5"
          : "top-1/2 -translate-y-1/2",
        position === "inline" && "right-3.5",
        position === "trailing-control" && "right-11",
        className,
      )}
    />
  );
}

/** Border/ring classes to append to a field that failed validation. */
export const FIELD_ERROR_CLASS =
  "border-danger focus:border-danger focus:ring-danger/20";

/** Tracks which required fields were left empty on the last submit attempt.
 *
 *  `check(formData, names)` returns false (and fills `errors`) when any of the
 *  named fields is blank — call it before dispatching the action. `clear(name)`
 *  drops one field's error, wired to onInput/onChange so the red state goes
 *  away as soon as the visitor starts typing rather than sticking around until
 *  the next submit. */
export function useRequiredFields(message: string) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function check(data: FormData, names: readonly string[]): boolean {
    const next: Record<string, string> = {};
    for (const name of names) {
      const value = data.get(name);
      if (typeof value !== "string" || !value.trim()) next[name] = message;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function clear(name: string) {
    setErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  /** Everything a field needs to announce its error to assistive tech. */
  function fieldProps(name: string) {
    return {
      "aria-invalid": errors[name] ? (true as const) : undefined,
      "aria-describedby": errors[name] ? `${name}-error` : undefined,
    };
  }

  return { errors, check, clear, fieldProps };
}

/** Moves focus to the first field that failed, so a long form doesn't leave
 *  the visitor hunting for the red one. Call it right after a failed `check`. */
export function focusFirstError(form: HTMLFormElement, names: readonly string[]) {
  for (const name of names) {
    const el = form.elements.namedItem(name);
    const control =
      el instanceof RadioNodeList ? (el[0] as HTMLElement | undefined) : el;
    if (
      control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement ||
      control instanceof HTMLSelectElement
    ) {
      if (!control.value.trim()) {
        control.focus();
        return;
      }
    }
  }
}
