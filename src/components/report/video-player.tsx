"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from "lucide-react";

// Self-hosted MP4 player with our own controls (no native <video controls>,
// so no browser/YouTube-style chrome) — used for the uploaded-file branch of
// the report hero's video slide (see poster-slider.tsx). The embed (YouTube/
// Vimeo iframe) branch is untouched; this only covers our own files.

/** seconds -> "m:ss" (e.g. 75 -> "1:15"); NaN/Infinity (metadata not loaded
 *  yet) render as "0:00" rather than "NaN:NaN". */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const HIDE_DELAY_MS = 2500;

export function VideoPlayer({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Auto-hide the control bar ~2.5s after the last activity, but only while
  // playing — paused always shows the bar (and the big center Play button).
  function scheduleHide() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!videoRef.current || videoRef.current.paused) return;
    hideTimer.current = setTimeout(() => setShowControls(false), HIDE_DELAY_MS);
  }
  function wake() {
    setShowControls(true);
    scheduleHide();
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
    } else {
      v.pause();
    }
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function toggleFullscreen() {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapper.requestFullscreen();
    }
  }

  function seekTo(fraction: number) {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = Math.min(Math.max(fraction, 0), 1) * v.duration;
  }

  function seekBy(deltaSeconds: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(v.currentTime + deltaSeconds, 0), v.duration || 0);
  }

  function handleSeekBarClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    seekTo((e.clientX - rect.left) / rect.width);
  }

  function handleSeekBarDrag(e: React.MouseEvent<HTMLDivElement>) {
    if (e.buttons !== 1) return;
    handleSeekBarClick(e);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    switch (e.key) {
      case " ":
      case "k":
        e.preventDefault();
        togglePlay();
        break;
      case "f":
        toggleFullscreen();
        break;
      case "m":
        toggleMute();
        break;
      case "ArrowLeft":
        seekBy(-5);
        break;
      case "ArrowRight":
        seekBy(5);
        break;
    }
    wake();
  }

  const progress = duration > 0 ? currentTime / duration : 0;
  const transitionCls = reducedMotion ? "" : "transition-opacity duration-200";

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseMove={wake}
      onMouseLeave={() => playing && setShowControls(false)}
      className={`relative bg-black outline-none focus-visible:ring-2 focus-visible:ring-primary ${className ?? ""}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        preload="metadata"
        playsInline
        className="absolute inset-0 h-full w-full object-contain bg-black"
        onClick={togglePlay}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => {
          setPlaying(true);
          scheduleHide();
        }}
        onPause={() => {
          setPlaying(false);
          setShowControls(true);
        }}
        onEnded={() => {
          setPlaying(false);
          setShowControls(true);
        }}
      />

      {/* Big centered Play button — shown while paused, fades out once playing. */}
      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play"
          className={`absolute inset-0 m-auto grid h-16 w-16 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70 ${transitionCls}`}
        >
          <Play className="h-8 w-8 translate-x-0.5" fill="currentColor" />
        </button>
      )}

      {/* Bottom control bar */}
      <div
        className={`absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6 text-white motion-reduce:transition-none ${transitionCls} ${
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="shrink-0">
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>

        <span className="shrink-0 text-xs tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div
          onClick={handleSeekBarClick}
          onMouseMove={handleSeekBarDrag}
          className="group relative h-1.5 flex-1 cursor-pointer rounded-full bg-white/25"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--primary)] motion-reduce:transition-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="shrink-0">
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          className="shrink-0"
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
