"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Cpu,
  CupSoda,
  Car,
  Plane,
  Watch,
  Camera,
  Headphones,
  Gamepad2,
  ShoppingBag,
  Rocket,
  Shirt,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { makeUI, type Locale } from "@/lib/i18n";
import type { PartnerDTO } from "@/lib/types";

/* Decorative icon fallback by partner name (used until a real logo is uploaded). */
const NAME_ICON: Record<string, LucideIcon> = {
  NovaTech: Cpu,
  AuraDrinks: CupSoda,
  RoadKing: Car,
  SkyLine: Plane,
  Chrono: Watch,
  LensPro: Camera,
  SonicWave: Headphones,
  PixelPlay: Gamepad2,
  MarketX: ShoppingBag,
  PeakGear: Rocket,
  Vesta: Shirt,
  Lumen: Sparkles,
};

function LogoChip({ p }: { p: PartnerDTO }) {
  const Icon = NAME_ICON[p.name] ?? Sparkles;
  return (
    <a
      href={p.url}
      className="group/chip mx-3 inline-flex shrink-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 text-white/55 transition-all duration-300 hover:border-primary/40 hover:bg-white/[0.06] hover:text-white"
    >
      {p.logo ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={p.logo} alt={p.name} className="h-7 w-auto object-contain" />
      ) : (
        <Icon className="h-6 w-6 transition-colors group-hover/chip:text-primary" />
      )}
      <span className="text-lg font-semibold tracking-tight">{p.name}</span>
    </a>
  );
}

function MarqueeRow({
  items,
  direction,
  duration,
}: {
  items: PartnerDTO[];
  direction: "left" | "right";
  duration: number;
}) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee-row relative flex overflow-hidden">
      <div
        className="marquee-x flex w-max"
        style={{
          animationName: direction === "right" ? "marquee-right" : "marquee-left",
          animationDuration: `${duration}s`,
        }}
      >
        {doubled.map((p, i) => (
          <LogoChip key={`${p.name}-${i}`} p={p} />
        ))}
      </div>
    </div>
  );
}

/* Distinct background: slow drifting aurora blobs (not the projector/ember backdrop). */
function AuroraBackdrop() {
  const blobs = [
    { c: "rgba(229,9,20,0.18)", size: 520, top: "-10%", left: "-5%", dx: 60, dy: 40, dur: 18 },
    { c: "rgba(120,20,30,0.16)", size: 460, top: "30%", left: "65%", dx: -70, dy: 30, dur: 22 },
    { c: "rgba(60,60,80,0.18)", size: 600, top: "50%", left: "20%", dx: 50, dy: -50, dur: 26 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[100px]"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            background: b.c,
          }}
          animate={{ x: [0, b.dx, 0], y: [0, b.dy, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {/* thin film grain via repeating gradient lines */}
      <div className="absolute inset-0 opacity-[0.04] [background:repeating-linear-gradient(90deg,#fff_0_1px,transparent_1px_3px)]" />
    </div>
  );
}

export function Partners({
  partners,
  t,
  locale,
}: {
  partners: PartnerDTO[];
  t: Record<string, string>;
  locale: Locale;
}) {
  const ui = makeUI(locale);
  const half = Math.ceil(partners.length / 2);
  const rowA = partners.slice(0, half);
  const rowB = partners.slice(half);
  return (
    <section
      id="partners"
      className="relative isolate overflow-hidden bg-background py-24 md:py-28"
    >
      <AuroraBackdrop />

      <div className="relative z-10">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/70"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t["partners.eyebrow"]}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl"
          >
            {t["partners.heading"]}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-base text-white/65 sm:text-lg"
          >
            {t["partners.subtitle"]}
          </motion.p>
        </div>

        {/* dual marquee with edge fade masks */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mt-14 space-y-5 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
        >
          <MarqueeRow items={rowA} direction="left" duration={36} />
          <MarqueeRow items={rowB} direction="right" duration={42} />
        </motion.div>

        <p className="mt-12 text-center text-sm text-white/40">
          {ui("pt.hint")}
        </p>
      </div>
    </section>
  );
}
