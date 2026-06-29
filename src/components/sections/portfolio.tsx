"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLenis } from "lenis/react";
import {
  Play,
  Images,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SectionBackdrop } from "@/components/sections/section-backdrop";
import { makeUI, type Locale } from "@/lib/i18n";
import type { PortfolioDTO, PortfolioMediaDTO } from "@/lib/types";

type Media = PortfolioMediaDTO;
type Case = PortfolioDTO;
type UI = (key: string) => string;

export function Portfolio({
  cases,
  t,
  locale,
}: {
  cases: PortfolioDTO[];
  t: Record<string, string>;
  locale: Locale;
}) {
  const ui = makeUI(locale);
  const [active, setActive] = useState<Case | null>(null);

  return (
    <section
      id="portfolio"
      className="relative isolate overflow-hidden bg-background py-24 md:py-32"
    >
      <SectionBackdrop emberCount={14} />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/70"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t["portfolio.eyebrow"]}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl"
          >
            {t["portfolio.heading"]}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-base text-white/65 sm:text-lg"
          >
            {t["portfolio.subtitle"]}
          </motion.p>
        </div>

        <div className="mt-14 grid auto-rows-[260px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c, i) => (
            <CaseCard
              key={c.id}
              data={c}
              index={i}
              featured={i === 0}
              ui={ui}
              onOpen={() => setActive(c)}
            />
          ))}
        </div>
      </div>

      <Lightbox data={active} onClose={() => setActive(null)} ui={ui} />
    </section>
  );
}

function CaseCard({
  data: c,
  index,
  featured,
  ui,
  onOpen,
}: {
  data: Case;
  index: number;
  featured?: boolean;
  ui: UI;
  onOpen: () => void;
}) {
  const hasVideo = c.media.some((m) => m.type === "youtube");
  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      onClick={onOpen}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 text-left transition-all duration-300 hover:border-primary/40 hover:shadow-[0_20px_50px_-20px_rgba(229,9,20,0.5)] ${
        featured ? "sm:col-span-2 sm:row-span-2 lg:row-span-2" : ""
      }`}
    >
      {c.cover && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={c.cover}
          alt={`${c.brand} × ${c.film}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {/* top badges */}
      <div className="absolute left-4 top-4 flex gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white/90 backdrop-blur">
          <Images className="h-3 w-3" />
          {c.media.length}
        </span>
        {hasVideo && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            <Play className="h-3 w-3 fill-current" />
            {ui("pf.video")}
          </span>
        )}
      </div>

      {/* play affordance on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="grid h-14 w-14 place-items-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur">
          <Play className="h-6 w-6 translate-x-0.5 fill-current" />
        </span>
      </div>

      {/* caption */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-xs uppercase tracking-wide text-primary">{c.brand}</p>
        <h3 className={`mt-1 font-bold text-foreground ${featured ? "text-2xl" : "text-lg"}`}>
          {c.film}
        </h3>
        {featured && (
          <p className="mt-2 max-w-md text-sm text-white/70 line-clamp-2">
            {c.description}
          </p>
        )}
      </div>
    </motion.button>
  );
}

function Lightbox({ data: c, onClose, ui }: { data: Case | null; onClose: () => void; ui: UI }) {
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const lenis = useLenis();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (c) setIdx(0);
  }, [c]);

  useEffect(() => {
    if (!c) return;
    lenis?.stop();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % c.media.length);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + c.media.length) % c.media.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [c, onClose, lenis]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {c && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl"
          >
            <button
              onClick={onClose}
              aria-label={ui("a11y.close")}
              className="absolute -top-12 right-0 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/50 text-white/80 transition-colors hover:bg-black/80 hover:text-white sm:-right-2"
            >
              <X className="h-5 w-5" />
            </button>

            {/* main stage */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
              <AnimatePresence mode="wait">
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0"
                >
                  <MediaView media={c.media[idx]} ui={ui} />
                </motion.div>
              </AnimatePresence>

              {c.media.length > 1 && (
                <>
                  <button
                    onClick={() => setIdx((i) => (i - 1 + c.media.length) % c.media.length)}
                    aria-label={ui("a11y.prev")}
                    className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/80"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setIdx((i) => (i + 1) % c.media.length)}
                    aria-label={ui("a11y.next")}
                    className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/80"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* thumbnails */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {c.media.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${i === idx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.type === "image" ? m.src : m.poster}
                    alt=""
                    aria-hidden
                    className="h-full w-full object-cover"
                  />
                  {m.type === "youtube" && (
                    <span className="absolute inset-0 grid place-items-center bg-black/40">
                      <Play className="h-4 w-4 fill-white text-white" />
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* caption */}
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-primary">
                {c.brand} × {c.film}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                {c.description}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function MediaView({ media, ui }: { media: Media; ui: UI }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => setPlaying(false), [media]);

  if (media.type === "image") {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={media.src}
        alt=""
        className="h-full w-full object-cover"
      />
    );
  }

  // youtube: thumbnail + play → iframe (lite embed, loads only on click)
  if (!playing) {
    return (
      <button
        onClick={() => setPlaying(true)}
        className="group relative h-full w-full"
        aria-label={ui("a11y.watchVideo")}
      >
        {media.poster && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={media.poster}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/40 transition-colors group-hover:bg-black/55">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary text-white shadow-[0_8px_30px_-6px_rgba(229,9,20,0.8)]">
            <Play className="h-7 w-7 translate-x-0.5 fill-current" />
          </span>
        </span>
      </button>
    );
  }
  return (
    <iframe
      className="h-full w-full"
      src={`https://www.youtube-nocookie.com/embed/${media.id}?autoplay=1&rel=0`}
      title="Видео кейса"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
