"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Ticket,
  Clapperboard,
  AlarmClock,
  MapPin,
  X,
} from "lucide-react";
import { PLATFORM_STYLE } from "@/lib/constants";
import { makeUI, type Locale } from "@/lib/i18n";
import type { ProjectDTO } from "@/lib/types";
import { ActorAvatar } from "@/components/actor-avatar";
import { ProjectApplyForm } from "@/components/project-apply-form";

export function ProjectDetail({
  project: p,
  locale,
}: {
  project: ProjectDTO;
  locale: Locale;
}) {
  const ui = makeUI(locale);
  const [applyOpen, setApplyOpen] = useState(false);

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* ── Cinematic hero (frame shown in full, never cropped) ── */}
      <div className="relative w-full overflow-hidden bg-black pt-16">
        {p.poster && (
          <>
            {/* blurred fill so letterbox bars are never plain black */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.poster}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
            />
            <div className="absolute inset-0 bg-background/40" />
            {/* the real frame — full, uncropped */}
            <div className="relative mx-auto w-full max-w-5xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.poster}
                alt={p.title}
                className="mx-auto max-h-[70vh] w-full object-contain"
              />
            </div>
          </>
        )}
        {!p.poster && <div className="h-40" />}

        {/* bottom fade into the page */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* ── Title block ────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {ui("pd.back")}
        </Link>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
            {p.genre}
          </span>
          <span className="rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
            {p.placement}
          </span>
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl"
        >
          {p.title}
        </motion.h1>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="mx-auto grid max-w-6xl gap-10 px-6 pt-10 lg:grid-cols-[1fr_340px]">
        {/* main column */}
        <div className="space-y-12">
          {/* synopsis */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              {ui("pd.about")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">
              {p.description}
            </p>
          </section>

          {/* actors */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              {ui("pd.actors")}
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {p.actors.map((a, i) => (
                <motion.div
                  key={`${a.firstName}-${a.lastName}`}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <ActorAvatar actor={a} className="h-14 w-14" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {a.firstName} {a.lastName}
                    </p>
                    <p className="truncate text-xs text-white/55">{a.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* scenes for placement */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              {ui("pd.scenes")}
            </h2>
            <div className="mt-5 space-y-4">
              {p.scenes.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-center gap-2">
                    <Clapperboard className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-foreground">{s.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    {s.description}
                  </p>
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-sm text-white/80">
                      <span className="font-medium text-primary">
                        {ui("pd.possible")}{" "}
                      </span>
                      {s.placement}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* gallery */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              {ui("pd.frames")}
            </h2>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {p.gallery.map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-video overflow-hidden rounded-lg ring-1 ring-white/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    aria-hidden
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="space-y-4 text-sm">
              <Row icon={<Ticket className="h-4 w-4" />} label={ui("pd.slots")}>
                {ui("pd.slotsValue").replace("{a}", String(p.slotsAvailable)).replace("{b}", String(p.slotsTotal))}
              </Row>
              <Row icon={<CalendarDays className="h-4 w-4" />} label={ui("pd.release")}>
                {p.release}
              </Row>
              <Row icon={<AlarmClock className="h-4 w-4" />} label={ui("pd.deadline")}>
                {p.deadlineDate}
              </Row>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">
                  {ui("pd.platforms")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.platforms.map((pl) => (
                    <span
                      key={pl}
                      className={`rounded border px-2 py-0.5 text-[11px] font-medium ${PLATFORM_STYLE[pl] ?? "border-white/15 bg-white/5 text-white/60"}`}
                    >
                      {pl}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">
                  {ui("pd.price")}
                </p>
                <p className="mt-1 font-semibold text-foreground">{ui("pd.onRequest")}</p>
              </div>
            </div>

            <button
              onClick={() => setApplyOpen(true)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_30px_-8px_rgba(229,9,20,0.7)] transition-all hover:scale-[1.02] hover:bg-red-600"
            >
              {ui("pd.apply")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </aside>
      </div>

      <ApplyModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        projectTitle={p.title}
        locale={locale}
        ui={ui}
      />
    </main>
  );
}

function ApplyModal({
  open,
  onClose,
  projectTitle,
  locale,
  ui,
}: {
  open: boolean;
  onClose: () => void;
  projectTitle: string;
  locale: Locale;
  ui: (key: string) => string;
}) {
  const lenis = useLenis();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, lenis]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-2xl"
          >
            <button
              onClick={onClose}
              aria-label={ui("a11y.close")}
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur transition-colors hover:bg-black/80 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <ProjectApplyForm projectTitle={projectTitle} locale={locale} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
      <span className="flex items-center gap-2 text-white/55">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium text-foreground">{children}</span>
    </div>
  );
}
