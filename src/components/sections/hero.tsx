"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
import { makeUI, type Locale } from "@/lib/i18n";

/* Cinematic placeholder posters — real photos served locally from
   /public/posters (same-origin, no external dependency). Swap for real
   project posters later via the admin panel. */
const COLUMNS = [
  { imgs: [1, 6, 11, 16, 21, 3], dur: 50, dir: "up", delay: -12 },
  { imgs: [2, 7, 12, 17, 22, 8], dur: 44, dir: "down", delay: -30 },
  { imgs: [4, 9, 13, 18, 23, 5], dur: 56, dir: "up", delay: -8 },
  { imgs: [10, 14, 19, 24, 6, 1], dur: 46, dir: "down", delay: -22 },
  { imgs: [15, 20, 9, 12, 7, 3], dur: 52, dir: "up", delay: -16 },
] as const;

function posterSrc(n: number) {
  return `/posters/poster-${String(n).padStart(2, "0")}.jpg`;
}

function ParallaxColumn({
  col,
  progress,
  speed,
  offsetClass,
}: {
  col: (typeof COLUMNS)[number];
  progress: MotionValue<number>;
  speed: number;
  offsetClass: string;
}) {
  // Outer layer: depth parallax driven by page scroll.
  const y = useTransform(progress, [0, 1], ["0%", `${speed}%`]);
  return (
    <motion.div style={{ y }} className={`will-change-transform ${offsetClass}`}>
      {/* Inner layer: continuous auto-marquee (alive at rest). */}
      <div
        className="marquee-col flex flex-col gap-4"
        style={{
          animationDuration: `${col.dur}s`,
          animationDelay: `${col.delay}s`,
          animationName: col.dir === "down" ? "marquee-down" : "marquee-up",
        }}
      >
        {[...col.imgs, ...col.imgs].map((n, i) => (
          <div
            key={i}
            aria-hidden
            className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-900 ring-1 ring-white/10 shadow-2xl shadow-black/60"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterSrc(n)}
              alt=""
              aria-hidden
              loading="lazy"
              draggable={false}
              className="h-full w-full object-cover"
            />
            {/* cinematic colour grade + bottom fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function Hero({
  t,
  locale,
}: {
  t: Record<string, string>;
  locale: Locale;
}) {
  const ui = makeUI(locale);
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -140]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.12]);

  const speeds = reduce ? [0, 0, 0, 0, 0] : [-18, -30, -12, -36, -22];

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-[100svh] w-full items-center overflow-hidden bg-background"
    >
      {/* ── Parallax poster wall ─────────────────────────────── */}
      <motion.div
        style={{ scale: bgScale }}
        className="pointer-events-none absolute inset-0 z-0"
      >
        <div className="absolute inset-x-0 -top-[30%] grid h-[160%] grid-cols-3 justify-center gap-4 px-2 opacity-90 sm:grid-cols-4 md:grid-cols-5 md:gap-5">
          {COLUMNS.map((col, i) => (
            <ParallaxColumn
              key={i}
              col={col}
              progress={scrollYProgress}
              speed={speeds[i]}
              offsetClass={
                i >= 4
                  ? "hidden md:block"
                  : i >= 3
                    ? "hidden sm:block"
                    : ""
              }
            />
          ))}
        </div>
      </motion.div>

      {/* ── Cinematic overlays (posters stay clearly visible) ── */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 z-0 h-[65vh] w-[65vh] -translate-x-1/2 rounded-full bg-primary/25 blur-[120px]" />
      {/* light edge vignette only */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(11,11,11,0)_30%,rgba(11,11,11,0.35)_80%,rgba(11,11,11,0.8)_100%)]" />
      {/* focused scrim directly behind the headline for legibility */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[70%] w-[min(900px,92%)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(8,8,8,0.85)_0%,rgba(8,8,8,0.55)_45%,transparent_72%)] blur-xl" />
      {/* bottom vignette → seamless blend into next (black) section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[40%] bg-[linear-gradient(180deg,rgba(11,11,11,0)_0%,rgba(11,11,11,1)_92%)]" />

      {/* ── Foreground content ───────────────────────────────── */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto w-full max-w-5xl px-6 text-center"
      >
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/80 backdrop-blur"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          {t["hero.eyebrow"]}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.08 }}
          className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)] sm:text-6xl md:text-7xl"
        >
          {t["hero.titleLead"]}{" "}
          <span className="bg-gradient-to-r from-primary via-red-500 to-primary bg-clip-text text-transparent">
            {t["hero.titleAccent"]}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.16 }}
          className="mx-auto mt-6 max-w-2xl text-pretty text-base text-white/80 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:text-lg"
        >
          {t["hero.subtitle"]}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.24 }}
          className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="#contact"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_30px_-8px_rgba(229,9,20,0.7)] transition-all duration-200 hover:scale-[1.03] hover:bg-red-600 sm:w-auto"
          >
            {t["hero.ctaPrimary"]}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="#catalog"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-all duration-200 hover:border-white/30 hover:bg-white/10 sm:w-auto"
          >
            <Play className="h-4 w-4 fill-current" />
            {t["hero.ctaSecondary"]}
          </a>
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator ─────────────────────────────────── */}
      <motion.a
        href="#how"
        aria-label={ui("a11y.scrollDown")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/60 transition-colors hover:text-white"
      >
        <motion.span
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="block"
        >
          <ChevronDown className="h-6 w-6" />
        </motion.span>
      </motion.a>
    </section>
  );
}
