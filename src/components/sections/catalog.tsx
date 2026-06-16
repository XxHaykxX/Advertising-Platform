"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLenis } from "lenis/react";
import {
  Search,
  ChevronDown,
  AlarmClock,
  Ticket,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { SectionBackdrop } from "@/components/sections/section-backdrop";
import { GENRES } from "@/lib/constants";
import { makeUI, type Locale } from "@/lib/i18n";
import type { ProjectDTO } from "@/lib/types";

const DEADLINE_KEYS = ["all", "1", "3", "6", "12"] as const;
type UI = (key: string) => string;

const PLATFORM_STYLE: Record<string, string> = {
  YouTube: "bg-red-600/15 text-red-400 border-red-500/30",
  Kinodaran: "bg-white/10 text-white/80 border-white/20",
  TV: "bg-sky-500/15 text-sky-300 border-sky-400/30",
};

export function Catalog({
  projects,
  t,
  locale,
}: {
  projects: ProjectDTO[];
  t: Record<string, string>;
  locale: Locale;
}) {
  const ui = makeUI(locale);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<string>("Все жанры");
  const [genreOpen, setGenreOpen] = useState(false);
  const [deadline, setDeadline] = useState("all");
  const router = useRouter();
  const lenis = useLenis();

  const filtered = useMemo(() => {
    const now = new Date();
    return projects.filter((p) => {
      if (query && !p.title.toLowerCase().includes(query.toLowerCase()))
        return false;
      if (genre !== "Все жанры" && p.genre !== genre) return false;
      if (deadline !== "all") {
        const months = Number(deadline);
        const limit = new Date(now);
        limit.setMonth(limit.getMonth() + months);
        if (new Date(p.deadline) > limit) return false;
      }
      return true;
    });
  }, [projects, query, genre, deadline]);

  function goContact(projectTitle?: string) {
    if (projectTitle) {
      window.dispatchEvent(
        new CustomEvent("advplatform:select-project", { detail: projectTitle }),
      );
    }
    if (lenis) {
      lenis.start();
      lenis.scrollTo("#contact", { offset: -80 });
    } else {
      document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <section
      id="catalog"
      className="relative isolate overflow-hidden bg-background py-24 md:py-32"
    >
      <SectionBackdrop emberCount={16} />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/70"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t["catalog.eyebrow"]}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl"
          >
            {t["catalog.heading"]}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-base text-white/65 sm:text-lg"
          >
            {t["catalog.subtitle"]}
          </motion.p>
        </div>

        {/* Filter bar */}
        <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm lg:flex-row lg:items-center">
          {/* search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ui("catalog.search")}
              className="w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-white/40 outline-none transition-colors focus:border-primary/50"
            />
          </div>

          {/* genre */}
          <div className="relative">
            <button
              onClick={() => setGenreOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-foreground transition-colors hover:border-white/30 lg:w-48"
            >
              {genre === "Все жанры" ? ui("catalog.allGenres") : genre}
              <ChevronDown
                className={`h-4 w-4 text-white/50 transition-transform ${genreOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {genreOpen && (
                <motion.ul
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-[#141414] p-1 shadow-xl"
                >
                  {["Все жанры", ...GENRES].map((g) => (
                    <li key={g}>
                      <button
                        onClick={() => {
                          setGenre(g);
                          setGenreOpen(false);
                        }}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-white/10 ${g === genre ? "text-primary" : "text-white/80"}`}
                      >
                        {g === "Все жанры" ? ui("catalog.allGenres") : g}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* deadline chips */}
          <div className="flex flex-wrap items-center gap-2">
            {DEADLINE_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setDeadline(key)}
                className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-all ${
                  deadline === key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-white/15 bg-black/30 text-white/60 hover:border-white/30 hover:text-white"
                }`}
              >
                {ui(`deadline.${key}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="mt-6 text-sm text-white/45">
          {ui("catalog.found")} {filtered.length}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center text-white/50">
            {ui("catalog.notFound")}
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                index={i}
                ui={ui}
                onOpen={() => router.push(`/projects/${p.id}`)}
                onApply={goContact}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SlotBar({ total, available, ui }: { total: number; available: number; ui: UI }) {
  const pct = total > 0 ? Math.round((available / total) * 100) : 0;
  const low = available <= 1;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-white/60">
          <Ticket className="h-3.5 w-3.5" />
          {ui("card.slots").replace("{a}", String(available)).replace("{b}", String(total))}
        </span>
        {low && <span className="font-semibold text-primary">{ui("card.fewLeft")}</span>}
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-red-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ProjectCard({
  project: p,
  index,
  ui,
  onOpen,
  onApply,
}: {
  project: ProjectDTO;
  index: number;
  ui: UI;
  onOpen: () => void;
  onApply: (title?: string) => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      onClick={onOpen}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_20px_50px_-20px_rgba(229,9,20,0.5)]"
    >
      {/* poster */}
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
        {p.poster && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={p.poster}
            alt={p.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white/90 backdrop-blur">
            {p.genre}
          </span>
        </div>
      </div>

      {/* body */}
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold text-foreground">{p.title}</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {p.placement}
          </span>
          <span className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-white/60">
            {ui("catalog.priceOnRequest")}
          </span>
        </div>

        <SlotBar total={p.slotsTotal} available={p.slotsAvailable} ui={ui} />

        <div className="flex items-center gap-2 text-xs text-white/60">
          <CalendarDays className="h-3.5 w-3.5" />
          {ui("card.release")} {p.release}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {p.platforms.map((pl) => (
            <span
              key={pl}
              className={`rounded border px-2 py-0.5 text-[11px] font-medium ${PLATFORM_STYLE[pl] ?? "border-white/15 bg-white/5 text-white/60"}`}
            >
              {pl}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <AlarmClock className="h-3.5 w-3.5" />
          {p.deadlineLabel}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-medium text-white/70 transition-colors group-hover:text-foreground">
            {ui("card.more")}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApply(p.title);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-red-600"
          >
            {ui("card.apply")}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
