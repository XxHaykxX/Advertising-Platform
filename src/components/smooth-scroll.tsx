"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

/**
 * App-wide smooth scroll. Drives the vertical parallax storytelling:
 * every section's scroll progress is read from this single Lenis instance.
 * Respects prefers-reduced-motion by disabling smoothing.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.09,
        duration: 1.2,
        smoothWheel: !reduce,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
      }}
    >
      {children}
    </ReactLenis>
  );
}
