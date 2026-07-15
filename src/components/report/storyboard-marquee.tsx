"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

/** Storyboard as a single row that auto-scrolls continuously and can also be
    dragged left/right with the mouse. The image set is doubled and scrollLeft
    wraps at the half-width for a seamless loop. Auto-scroll pauses on hover,
    while dragging, and under reduced motion. */
export function StoryboardMarquee({ images, alt }: { images: string[]; alt: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const doubled = [...images, ...images];

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = 1.3; // px per frame ≈ full loop in ~70s
    let raf = 0;
    let hovering = false;
    let dragging = false;

    const half = () => el.scrollWidth / 2;
    const wrap = () => {
      const h = half();
      if (h <= 0) return;
      if (el.scrollLeft >= h) el.scrollLeft -= h;
      else if (el.scrollLeft < 0) el.scrollLeft += h;
    };

    const tick = () => {
      if (!hovering && !dragging && !reduce) {
        el.scrollLeft += speed;
        wrap();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onEnter = () => (hovering = true);
    const onLeave = () => (hovering = false);

    let startX = 0;
    let startLeft = 0;
    let moved = false;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      moved = false;
      startX = e.pageX;
      startLeft = el.scrollLeft;
      el.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 3) moved = true;
      el.scrollLeft = startLeft - dx;
      wrap();
    };
    const onUp = () => {
      dragging = false;
    };
    // Swallow the click that follows a real drag so it doesn't open the report.
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClick, true);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, []);

  if (images.length === 0) return null;

  return (
    <div
      ref={scrollerRef}
      className="flex cursor-grab touch-pan-y overflow-x-auto select-none scroll-auto active:cursor-grabbing [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {doubled.map((src, i) => (
        <div
          key={i}
          className="relative mr-3 aspect-video w-[clamp(200px,40vw,300px)] shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
        >
          <Image
            src={src}
            alt={`${alt} — ${(i % images.length) + 1}`}
            fill
            sizes="300px"
            draggable={false}
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
