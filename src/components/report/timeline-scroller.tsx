"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useDragScroll } from "@/lib/use-drag-scroll";

export type TimelineDot = {
  id: number;
  /** The stage's own free-text name — used as the dot's accessible label, so
   *  no dictionary key is needed for it. */
  label: string;
  state: "done" | "active" | "upcoming";
};

/** Scroll behaviour for the production timeline (audit B1, owner decision
 *  2026-07-29: fix our own component rather than adopt a library).
 *
 *  The rail is wider than the page as soon as a project has more than about
 *  five stages — ten stages come to 2400px against a 1152px container — and
 *  before this the only hint that it scrolled at all was the scrollbar, which
 *  the platform hides. Three things fix that: the current stage is scrolled
 *  into view on mount (it was landing off-screen right on a ten-stage
 *  project), a fade at whichever edge still has content marks the direction
 *  to drag, and on a phone the rail snaps stage by stage with a row of dots
 *  underneath, so the visitor can see how many stages there are and where in
 *  them they are. */
export function TimelineScroller({
  dots,
  children,
}: {
  dots: TimelineDot[];
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [current, setCurrent] = useState(0);
  // The rail is wider than the page and a mouse wheel scrolls the page, not
  // the rail — without this a desktop visitor has no way to move it at all.
  useDragScroll(ref);

  // The scroll handler reads layout for every node, so running it on the raw
  // scroll event forces a reflow several times per frame while a finger drags
  // the rail. One measurement per animation frame is enough for a fade and a
  // dot.
  const frame = useRef<number | null>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // 1px of tolerance: fractional layout widths otherwise leave a fade lit
    // at an edge that has nothing left to scroll to.
    setCanLeft(el.scrollLeft > 1);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);

    // Which stage is nearest the middle of the viewport — that's the one the
    // dots highlight.
    const box = el.getBoundingClientRect();
    const centre = box.left + box.width / 2;
    let best = 0;
    let bestDistance = Infinity;
    el.querySelectorAll<HTMLElement>("[data-node-index]").forEach((node) => {
      const rect = node.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - centre);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = Number(node.dataset.nodeIndex);
      }
    });
    setCurrent(best);
  }, []);

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior) => {
    const el = ref.current;
    if (!el) return;
    const node = el.querySelector<HTMLElement>(`[data-node-index="${index}"]`);
    if (!node) return;
    const box = el.getBoundingClientRect();
    const rect = node.getBoundingClientRect();
    // Deliberately NOT scrollIntoView: that would scroll the page vertically
    // to the timeline on load, hijacking a visitor who is still reading the
    // hero. Only this container's own scrollLeft moves.
    const delta = rect.left - box.left - (box.width - rect.width) / 2;
    // A smooth scroll is motion the visitor didn't ask for; honour the same
    // preference the CSS animations do.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: el.scrollLeft + delta, behavior: reduced ? "auto" : behavior });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const activeIndex = dots.findIndex((d) => d.state === "active");
    if (activeIndex > 0) scrollToIndex(activeIndex, "auto");
    measure();

    const onScroll = () => {
      if (frame.current != null) return;
      frame.current = window.requestAnimationFrame(() => {
        frame.current = null;
        measure();
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      if (frame.current != null) window.cancelAnimationFrame(frame.current);
      frame.current = null;
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
    // dots is rebuilt on every render; its length and the active stage are what
    // matter, and both come from the same server render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, scrollToIndex, dots.length]);

  return (
    <div className="ptl-scrollwrap">
      <div ref={ref} className="ptl-scroller">
        {children}
      </div>
      <div className={`ptl-fade ptl-fade--left${canLeft ? " is-on" : ""}`} aria-hidden="true" />
      <div className={`ptl-fade ptl-fade--right${canRight ? " is-on" : ""}`} aria-hidden="true" />

      {/* Phone only: the rail shows roughly one stage at a time there, so
          without this there is nothing to say how many stages exist. Each dot
          is a real button — tapping it is easier than dragging a long rail. */}
      <div className="ptl-dots">
        {dots.map((dot, i) => (
          <button
            key={dot.id}
            type="button"
            onClick={() => scrollToIndex(i, "smooth")}
            aria-label={dot.label}
            aria-current={i === current ? "true" : undefined}
            className={`ptl-dot-btn ptl-dot-btn--${dot.state}${i === current ? " is-current" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
