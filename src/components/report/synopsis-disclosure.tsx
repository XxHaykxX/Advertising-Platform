"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

/** Report-page synopsis that starts clamped to a few lines and expands on click,
    with a rotating chevron affordance. Client component — the surrounding hero
    stays a server component and just passes the text + localized labels in. */
export function SynopsisDisclosure({
  text,
  moreLabel,
  lessLabel,
}: {
  text: string;
  moreLabel: string;
  lessLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const pRef = useRef<HTMLParagraphElement>(null);

  // Only surface the toggle when the clamped text actually overflows its 3 lines.
  // Measurement is only valid while clamped, so we skip it when expanded and keep
  // the last known value. Re-measure on resize (reflow can change line count).
  useLayoutEffect(() => {
    const el = pRef.current;
    if (!el) return;
    const measure = () => {
      if (open) return;
      setOverflowing(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text, open]);

  return (
    <div className="mt-4 max-w-3xl">
      <p
        ref={pRef}
        className={`text-base leading-relaxed text-muted-foreground transition-all ${
          open ? "" : "line-clamp-3"
        }`}
      >
        {text}
      </p>
      {overflowing && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          {open ? lessLabel : moreLabel}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
