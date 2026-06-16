"use client";

import { useRef } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { ArrowLeft } from "lucide-react";
import { ExperienceCanvas } from "@/components/experience/experience-canvas";

export default function ExperiencePage() {
  // Scroll progress (0..1) driven by Lenis — read every frame inside the Canvas.
  const progress = useRef(0);
  useLenis((lenis) => {
    progress.current = lenis.progress || 0;
  });

  return (
    <>
      {/* Fixed 3D stage covers the viewport (and the global header/footer). */}
      <div className="fixed inset-0 z-[100] bg-[#0b0b0b]">
        <ExperienceCanvas progress={progress} />

        {/* HTML overlay pinned over the 3D */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <Link
            href="/"
            className="pointer-events-auto absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            На сайт
          </Link>

          <div className="absolute left-1/2 top-[14%] w-full -translate-x-1/2 px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              AD PLACEMENT
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.95)] sm:text-6xl">
              Кинопутешествие
            </h1>
            <p className="mt-3 text-sm text-white/70 sm:text-base">
              Листайте — летите сквозь будущие проекты платформы
            </p>
          </div>

          <div className="absolute bottom-7 left-1/2 -translate-x-1/2 animate-pulse text-xs uppercase tracking-[0.25em] text-white/45">
            Скролл ↓
          </div>

          {/* cinematic vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.6)_100%)]" />
        </div>
      </div>

      {/* Tall spacer creates the scroll length that drives the fly-through. */}
      <div aria-hidden style={{ height: "650vh" }} />
    </>
  );
}
