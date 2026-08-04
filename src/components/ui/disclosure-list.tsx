"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

// A11y + animation pattern copied from src/components/faq.tsx (aria-expanded/
// aria-controls, heading wraps the button, ChevronDown, AnimatePresence,
// useReducedMotion, duration 0.3 / ease [0.2,0.8,0.2,1]). Differs from that
// component in three ways this page needs: several rows can be open at once
// (a Set, not a single index), an "expand all" control, and a row whose id
// matches the URL hash opens + scrolls into view on load (deep links, e.g.
// support pointing a creator straight at #f-poster).

const EASE = [0.2, 0.8, 0.2, 1] as const;

export interface DisclosureRow {
  /** Bare field id — the row's DOM id becomes `f-<id>`. */
  id: string;
  /** Pre-built label (+ badge, etc.) — already-resolved strings/elements,
   *  same "server resolves the copy, client just renders it" split as the
   *  rest of this page. */
  title: ReactNode;
  content: ReactNode;
}

export function DisclosureList({
  rows,
  expandAllLabel,
  collapseAllLabel,
}: {
  rows: DisclosureRow[];
  expandAllLabel: string;
  collapseAllLabel: string;
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const reducedMotion = useReducedMotion();
  const groupId = useId();

  // Auto-open + scroll to the row matching #f-<id> on load. Only fires once:
  // a hash typed/clicked after mount is a normal same-page jump, not
  // something this component needs to intercept.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#f-")) return;
    const id = hash.slice(3);
    if (!rows.some((row) => row.id === id)) return;
    setOpenIds((prev) => new Set(prev).add(id));
    // Let the panel render before scrolling to it.
    requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allOpen = rows.length > 0 && rows.every((row) => openIds.has(row.id));

  function toggleRow(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setOpenIds(allOpen ? new Set() : new Set(rows.map((row) => row.id)));
  }

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          {allOpen ? collapseAllLabel : expandAllLabel}
        </button>
      </div>

      <div className="divide-y divide-border border-t border-border">
        {rows.map((row) => {
          const isOpen = openIds.has(row.id);
          const buttonId = `${groupId}-trigger-${row.id}`;
          const panelId = `${groupId}-panel-${row.id}`;

          return (
            // scroll-mt-24: same sticky-header offset as
            // project-completeness-checklist.tsx's own anchor targets.
            <div key={row.id} id={`f-${row.id}`} className="scroll-mt-24">
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleRow(row.id)}
                  className="flex w-full items-center justify-between gap-4 py-6 text-left"
                >
                  {row.title}
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300",
                      isOpen && "rotate-180 text-primary",
                    )}
                    aria-hidden="true"
                  />
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    key="content"
                    initial={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={reducedMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                    exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <div className="pb-6 pr-10 text-sm leading-relaxed text-muted-foreground">
                      {row.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
