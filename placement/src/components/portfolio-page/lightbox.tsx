"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Film, X } from "lucide-react";
import type { PortfolioDTO } from "@/lib/types";
import { formatMetricLabel, parseMetrics } from "./metrics";

export function CaseLightbox({
  cases,
  activeIndex,
  onClose,
  onNavigate,
}: {
  cases: PortfolioDTO[];
  activeIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = activeIndex !== null ? cases[activeIndex] : null;

  useEffect(() => {
    if (!active || activeIndex === null) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((activeIndex + 1) % cases.length);
      if (e.key === "ArrowLeft") onNavigate((activeIndex - 1 + cases.length) % cases.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active, activeIndex, cases.length, onClose, onNavigate]);

  if (!mounted) return null;

  const metrics = active ? Object.entries(parseMetrics(active.metrics)) : [];

  return createPortal(
    <AnimatePresence>
      {active && activeIndex !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/70 p-4 backdrop-blur-sm sm:p-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-card/90 text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative aspect-video w-full bg-muted">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0"
                >
                  {active.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={active.image}
                      alt={`${active.brand} — ${active.title}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <Film className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {cases.length > 1 && (
                <>
                  <button
                    onClick={() => onNavigate((activeIndex - 1 + cases.length) % cases.length)}
                    aria-label="Previous case"
                    className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-foreground shadow-sm transition-colors hover:bg-muted"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onNavigate((activeIndex + 1) % cases.length)}
                    aria-label="Next case"
                    className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-foreground shadow-sm transition-colors hover:bg-muted"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            <div className="p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {active.brand}
              </p>
              <h3 className="mt-1 text-2xl font-bold text-foreground">{active.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {active.description}
              </p>

              {metrics.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {metrics.map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                    >
                      {value}
                      <span className="font-normal text-primary/70">{formatMetricLabel(key)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
