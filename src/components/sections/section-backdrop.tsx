"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Ember = {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  size: number;
  drift: number;
};

/* Film-grain noise as an inline SVG data URI (no network). */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

interface SectionBackdropProps {
  emberCount?: number;
  className?: string;
}

/**
 * Cinematic projector-light backdrop. Continues the film motif from the hero
 * WITHOUT reusing its scrolling-poster look: slow volumetric light beams, a
 * roaming spotlight, rising embers, a breathing glow and film grain.
 */
export function SectionBackdrop({
  emberCount = 38,
  className = "",
}: SectionBackdropProps) {
  const [embers, setEmbers] = React.useState<Ember[]>([]);
  const [reduce, setReduce] = React.useState(false);

  React.useEffect(() => {
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduce(r);
    if (r) return;
    setEmbers(
      Array.from({ length: emberCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100, // spread across full section height
        delay: Math.random() * 6,
        duration: 5 + Math.random() * 5,
        size: 2.5 + Math.random() * 3,
        drift: Math.random() * 50 - 25,
      })),
    );
  }, [emberCount]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      {/* Volumetric projector beams */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute -top-1/4 h-[150%] w-[28%] origin-top"
          style={{
            left: `${8 + i * 32}%`,
            rotate: i % 2 === 0 ? 14 : -12,
            background:
              "linear-gradient(180deg, rgba(229,9,20,0) 0%, rgba(229,9,20,0.12) 45%, rgba(229,9,20,0) 100%)",
            filter: "blur(28px)",
          }}
          animate={
            reduce
              ? undefined
              : { opacity: [0.25, 0.7, 0.25], x: [0, i % 2 === 0 ? 30 : -30, 0] }
          }
          transition={{
            duration: 11 + i * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.5,
          }}
        />
      ))}

      {/* Roaming spotlight */}
      <motion.div
        className="absolute top-0 h-full w-[55%]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(229,9,20,0.14) 0%, transparent 100%)",
        }}
        animate={reduce ? undefined : { left: ["-10%", "55%", "-10%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Breathing center glow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(229,9,20,0.13) 0%, transparent 60%)",
        }}
        animate={reduce ? undefined : { opacity: [0.35, 0.65, 0.35], scale: [1, 1.1, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Rising embers — spread across the whole section height */}
      {embers.map((e) => (
        <motion.div
          key={e.id}
          className="absolute rounded-full bg-primary"
          style={{
            width: e.size,
            height: e.size,
            left: `${e.x}%`,
            top: `${e.y}%`,
            boxShadow: "0 0 12px 2px rgba(229,9,20,0.9)",
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [0, -240], x: [0, e.drift], opacity: [0, 0.9, 0.7, 0] }}
          transition={{
            duration: e.duration,
            delay: e.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-screen"
        style={{ backgroundImage: GRAIN, backgroundSize: "160px 160px" }}
      />

      {/* Edge vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
