"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  // Opacity only, and half the time it used to take (2026-08-10). This wrapper
  // is used 105 times across the public pages — /for-creators alone stacks 18 —
  // and it used to also animate `y`, which lays out and paints the block on
  // every frame while the scroll that revealed it is still running. Opacity is
  // composited, so it costs the scroll nothing.
  //
  // `delay` is halved here rather than at the 105 call sites: callers stagger
  // siblings (0.08 * idx and similar), and at the old scale the last card in a
  // row finished well after the reader had scrolled past it.
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1], delay: delay / 2 }}
    >
      {children}
    </motion.div>
  );
}
