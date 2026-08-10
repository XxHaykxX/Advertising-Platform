"use client";

import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

// Lazy — lenis (~20 KB) has no reason to ship on /admin and /account, where
// `appLike` below always short-circuits before this is ever rendered (bundle
// audit 2026-07-31). Suspense's fallback is `children` itself, so the public
// pages that DO use it aren't left blank while the chunk streams in — they
// just render without smooth scroll for that first paint, same as the
// reduced-motion/appLike branches already do.
const ReactLenis = lazy(() =>
  import("lenis/react").then((m) => ({ default: m.ReactLenis })),
);

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
    <Suspense fallback={children}>
      {/* duration was lenis' own default, 1.2s — a full second of glide after
          the wheel stops, which the owner read as the page hanging rather than
          as an effect (reported 2026-08-10: "тяжело скроллить"). 0.6 keeps the
          easing but lets the page settle roughly when the hand does. */}
      <ReactLenis root options={{ lerp: 0.1, duration: 0.6, smoothWheel: true }}>
        {children}
      </ReactLenis>
    </Suspense>
  );
}
