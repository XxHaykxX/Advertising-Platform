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

/** A whole-form error — a rejected sign-in, an email already taken — as
 *  opposed to FieldError's "this one field is empty".
 *
 *  IA-56: it used to be a filled red box, which reads as a page-level banner
 *  and hid the fact that the inputs themselves are what's wrong. Now it is the
 *  same plain red line as a field error, with the (!) inline in front of it;
 *  the forms that can name the guilty fields also outline them with
 *  FIELD_ERROR_CLASS. `role="alert"` because unlike a field error nothing
 *  points at this text via aria-describedby. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 text-sm text-danger">
      <CircleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
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

/** Keeps a server-side submit error (and the red outlines drawn from it) only
 *  until the visitor starts fixing the fields.
 *
 *  `state` is the action result the error came with: a new one means a new
 *  submit, which un-dismisses. Compared during render through an explicit
 *  "seen" state rather than in an effect, so the error and the outlines appear
 *  in the same commit — an effect would paint one frame of the stale value.
 *  Call `dismiss()` from the same onInput that clears a required-field error. */
export function useSubmitError<S>(state: S, error?: string) {
  const [seen, setSeen] = useState(state);
  const [dismissed, setDismissed] = useState(false);
  if (seen !== state) {
    setSeen(state);
    setDismissed(false);
  }
  return { error: dismissed ? undefined : error, dismiss: () => setDismissed(true) };
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
