"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/i18n";
import { setLocale } from "@/lib/actions/locale";
import { cn } from "@/lib/utils";

/** Native display names for each supported locale. */
const LOCALE_NAMES: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  hy: "Հայերեն",
};

/** Language dropdown (RU / EN / HY). Pass `onDark` when floating over the
 *  cinematic hero (see header.tsx for the same light-on-dark convention). */
export function LocaleSwitcher({
  current,
  onDark = false,
  openUp = false,
  className,
}: {
  current: Locale;
  onDark?: boolean;
  /** Open the menu upward — use in the footer, where it sits at page bottom. */
  openUp?: boolean;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function changeLocale(l: Locale) {
    setOpen(false);
    if (l === current) return;
    startTransition(async () => {
      await setLocale(l);
      router.refresh();
    });
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-70",
          onDark ? "bg-white/10 text-white" : "bg-muted text-foreground"
        )}
      >
        <Globe className="h-3.5 w-3.5" />
        {current}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open !== openUp && "rotate-180"
          )}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className={cn(
            "absolute right-0 z-50 min-w-[9rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg shadow-black/10",
            openUp ? "bottom-full mb-2" : "top-full mt-2"
          )}
        >
          {LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={current === l}
                onClick={() => changeLocale(l)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                  current === l
                    ? "font-semibold text-primary"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span>
                  {LOCALE_NAMES[l]}
                  <span className="ml-1.5 text-xs uppercase text-muted-foreground">
                    {l}
                  </span>
                </span>
                {current === l && <Check className="h-4 w-4 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
