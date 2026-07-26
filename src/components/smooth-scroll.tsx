"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis } from "lenis/react";

/* Lenis smooth scrolling, for the marketing side only.
 *
 * Lenis takes over the wheel globally (`smoothWheel`) and preventDefault()s it,
 * so NOTHING nested scrolls by wheel unless it opts out with
 * `data-lenis-prevent`. On the landing pages that trade is fine; in the
 * app-like areas it is not — those are full of dropdown lists, media pickers,
 * modals and the 855-row translation table, and every one of them felt frozen
 * under the cursor (reported 2026-07-26: the cast Role dropdown had a visible
 * scrollbar the wheel would not move). So /admin and /account run with the
 * browser's own scrolling, and the public-side inner scrollers carry
 * `data-lenis-prevent`. */
const NO_SMOOTH_PREFIXES = ["/admin", "/account"];

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const appLike = NO_SMOOTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (reducedMotion || appLike) return <>{children}</>;

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
