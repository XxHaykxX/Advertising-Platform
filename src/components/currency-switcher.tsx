"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Coins } from "lucide-react";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { setCurrency } from "@/lib/actions/currency";
import { cn } from "@/lib/utils";

/** Symbol shown next to each currency's code in the dropdown. */
const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  AMD: "֏",
  USD: "$",
  EUR: "€",
  RUB: "₽",
};

/** Currency dropdown (AMD / USD / EUR / RUB). Clone of LocaleSwitcher — same
 *  markup, a11y, and light-on-dark convention (see header.tsx). */
export function CurrencySwitcher({
  current,
  onDark = false,
  openUp = false,
  className,
}: {
  current: CurrencyCode;
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

  function changeCurrency(c: CurrencyCode) {
    setOpen(false);
    if (c === current) return;
    startTransition(async () => {
      await setCurrency(c);
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
        aria-label="Currency"
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-70",
          onDark ? "bg-white/10 text-white" : "bg-muted text-foreground"
        )}
      >
        <Coins className="h-3.5 w-3.5" />
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
          aria-label="Currency"
          className={cn(
            "absolute right-0 z-50 min-w-[6rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg shadow-black/10",
            openUp ? "bottom-full mb-2" : "top-full mt-2"
          )}
        >
          {CURRENCIES.map((c) => (
            <li key={c}>
              <button
                type="button"
                role="option"
                aria-selected={current === c}
                onClick={() => changeCurrency(c)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                  current === c
                    ? "font-semibold text-primary"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span>
                  {c}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {CURRENCY_SYMBOLS[c]}
                  </span>
                </span>
                {current === c && <Check className="h-4 w-4 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
