"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** <input type="password"> with a show/hide toggle — drop-in replacement,
 *  forwards every standard input prop except `type` (always password/text).
 *  `showLabel`/`hideLabel` localize the toggle's aria-label (default English;
 *  member-facing forms pass hy/ru/en via t()). */
export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
    showLabel?: string;
    hideLabel?: string;
  }
>(function PasswordInput(
  { className, showLabel = "Show password", hideLabel = "Hide password", ...rest },
  ref,
) {
  const [show, setShow] = useState(false);
  // IA-4: track emptiness so the eye toggle stays disabled until there's input
  const [localHasValue, setLocalHasValue] = useState(Boolean(rest.value ?? rest.defaultValue));
  // Controlled inputs (value prop set) derive straight from the prop so
  // autofill / parent-driven updates aren't missed by the onChange-only state
  // below; uncontrolled inputs (defaultValue only) keep tracking local state.
  const hasValue = rest.value !== undefined ? String(rest.value).length > 0 : localHasValue;

  return (
    <div className="relative">
      <input
        ref={ref}
        type={show ? "text" : "password"}
        className={cn(className, "pr-10")}
        {...rest}
        onChange={(e) => {
          setLocalHasValue(e.target.value.length > 0);
          rest.onChange?.(e);
        }}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        disabled={!hasValue}
        aria-disabled={!hasValue}
        aria-label={show ? hideLabel : showLabel}
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground",
          !hasValue && "cursor-not-allowed opacity-50 hover:text-muted-foreground",
        )}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
