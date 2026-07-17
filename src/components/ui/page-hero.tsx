"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

/* Cinematic stills (served from /public/kino) shown as one tidy, contained
   film-reel band at the very bottom of the hero — never crossing the title.
   Shared visual base for /about (via AboutHero) and every other content page. */
const FRAMES = Array.from({ length: 12 }, (_, i) => i + 1);
function frameSrc(n: number) {
  return `/kino/frame-${String(n).padStart(2, "0")}.jpg`;
}

const EASE = [0.2, 0.8, 0.2, 1] as const;

export type PageHeroCta = { label: string; href: string };

export function PageHero({
  eyebrow,
  title,
  subtitle,
  locale = DEFAULT_LOCALE,
  primaryCta,
  secondaryCta,
  size = "compact",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  locale?: Locale;
  primaryCta?: PageHeroCta;
  secondaryCta?: PageHeroCta;
  /** "hero" = the full 80svh /about treatment, "compact" = shorter for internal pages. */
  size?: "hero" | "compact";
}) {
  const reduce = useReducedMotion();
  const isHero = size === "hero";
  void locale;

  return (
    <section className="relative isolate -mt-16 overflow-hidden bg-[#0b0b14] pt-16">
      {/* ── Ambient glow (behind the headline only, no imagery) ─── */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_28%,rgba(79,70,229,0.18),transparent_70%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[30%] z-0 h-[42vh] w-[42vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(11,11,20,0.9)_96%)]" />

      {/* ── Content ───────────────────────────────────────────── */}
      <div
        className={
          isHero
            ? "relative z-10 mx-auto flex min-h-[80svh] w-full flex-col items-center justify-center px-6 pb-44 pt-12 text-center"
            : "relative z-10 mx-auto flex min-h-[60svh] w-full flex-col items-center justify-center px-6 pb-32 pt-12 text-center"
        }
      >
        {eyebrow ? (
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-white/75 backdrop-blur"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
            {eyebrow}
          </motion.span>
        ) : null}

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
          className={
            (eyebrow ? "mt-7" : "") +
            " text-balance text-5xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-6xl md:text-7xl"
          }
        >
          <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-400 bg-clip-text text-transparent">
            {title}
          </span>
        </motion.h1>

        {subtitle ? (
          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.16 }}
            className="mt-6 max-w-2xl text-pretty text-base text-white/70 sm:text-lg"
          >
            {subtitle}
          </motion.p>
        ) : null}

        {primaryCta || secondaryCta ? (
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.24 }}
            className="mt-9 flex flex-col items-center gap-4 sm:flex-row"
          >
            {primaryCta ? (
              <Link
                href={primaryCta.href}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_30px_-8px_rgba(79,70,229,0.7)] transition-all duration-200 hover:scale-[1.03] hover:bg-[var(--primary-hover)] sm:w-auto"
              >
                {primaryCta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link
                href={secondaryCta.href}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all duration-200 hover:border-white/30 hover:bg-white/10 sm:w-auto"
              >
                {secondaryCta.label}
              </Link>
            ) : null}
          </motion.div>
        ) : null}
      </div>

      {/* ── Tidy film-reel band, pinned to the bottom edge ──────── */}
      <div
        aria-hidden
        className="marquee-row pointer-events-none absolute inset-x-0 bottom-0 z-0 h-28 border-t border-white/10 sm:h-32"
      >
        <div
          className="marquee-x flex h-full w-max items-center gap-3 px-3 py-4"
          style={{
            animationName: "marquee-left",
            animationDuration: reduce ? "0s" : "60s",
          }}
        >
          {[...FRAMES, ...FRAMES].map((n, i) => (
            <div
              key={i}
              className="relative aspect-video h-full shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={frameSrc(n)}
                alt=""
                aria-hidden
                loading="lazy"
                draggable={false}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>
          ))}
        </div>

        {/* fade the reel up into the dark, and soften both edges */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#0b0b14]/25 to-[#0b0b14]" />
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0b0b14] to-transparent" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0b0b14] to-transparent" />
      </div>
    </section>
  );
}
