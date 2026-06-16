"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Apple-style scroll scrub: preloads a numbered frame sequence and paints the
 * frame matching the scroll progress (0..1) onto a canvas (object-cover).
 * Draws only when the frame index changes. `progress` is fed from Lenis.
 */
export function SequenceScrub({
  frames,
  progress,
}: {
  frames: string[];
  progress: RefObject<number>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgs = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    imgs.current = frames.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }, [frames]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = -1;

    const draw = () => {
      const N = frames.length;
      const idx = Math.min(
        N - 1,
        Math.max(0, Math.round((progress.current ?? 0) * (N - 1))),
      );
      const img = imgs.current[idx];
      if (idx !== last && img?.complete && img.naturalWidth) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cw = cv.clientWidth;
        const ch = cv.clientHeight;
        if (cv.width !== cw * dpr || cv.height !== ch * dpr) {
          cv.width = cw * dpr;
          cv.height = ch * dpr;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const r = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
        const w = img.naturalWidth * r;
        const h = img.naturalHeight * r;
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
        last = idx;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [frames, progress]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
