"use client";

import { useEffect, type RefObject } from "react";

/** Drag-to-scroll for a horizontal strip, with a grab cursor.
 *
 *  A touch screen already scrolls these by swiping; a mouse had nothing —
 *  the wheel scrolls the page, not the strip, so a desktop visitor could only
 *  move the cast carousel with its arrows and the production timeline not at
 *  all (owner request 2026-07-29). Pointer events give the same swipe to a
 *  mouse.
 *
 *  Mouse only: on a touch device the browser's own inertial scrolling is
 *  better than anything reimplemented here, and hijacking the pointer there
 *  would fight scroll-snap.
 *
 *  A drag that moves more than a few pixels swallows the click that follows
 *  it, so dragging across a card never activates whatever sits under the
 *  cursor.
 *
 *  Some strips also carry CSS `scroll-snap` (for the arrow buttons). Snap
 *  fights a live drag — it keeps nudging `scrollLeft` back toward the nearest
 *  snap point while the pointer is still writing it every frame, which reads
 *  as rubbery. Snap is switched off for the duration of the drag *and* the
 *  fling below, and restored only once both are done, so it settles the
 *  final position instead of fighting the motion.
 *
 *  Releasing the pointer used to stop the strip dead. Real inertial scrolling
 *  keeps going, so on release this carries the last pointer velocity forward
 *  as a decaying fling (rAF-driven) until it's slow enough or the strip hits
 *  an end, and only then hands scroll-snap back. Pointer writes during the
 *  drag itself are batched to one rAF per frame so a burst of coalesced
 *  pointermove events doesn't force synchronous layout. */
const DRAG_THRESHOLD_PX = 5;

// Fling tuning: multiplicative decay applied once per animation frame. 0.95
// means a fast flick (~1.5 px/ms right after release) travels roughly a
// screen width and settles in well under a second; lower would feel abrupt,
// higher would drift for multiple seconds.
const FLING_DECAY = 0.95;
// Below this speed the fling is imperceptible — stop and hand scroll-snap
// back rather than run rAF forever chasing sub-pixel motion.
const FLING_MIN_SPEED = 0.05; // px/ms
// Only the last couple of pointermove samples are used for the release
// velocity — older samples are stale by the time the button comes up and
// would understate a flick that accelerated right at the end.
const VELOCITY_SAMPLE_WINDOW = 2;

export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let moved = false;

    // Last couple of pointermove samples (time + x), used to compute the
    // release velocity for the fling. A plain rolling window, not a full
    // history — see VELOCITY_SAMPLE_WINDOW above.
    let samples: { t: number; x: number }[] = [];

    // rAF batching for pointermove: only the latest target is kept, and the
    // write happens once per frame regardless of how many pointermove events
    // the browser coalesced into that frame.
    let pendingScrollLeft: number | null = null;
    let moveRafId: number | null = null;

    // The fling loop's own rAF handle, separate from the move batching above
    // so a fresh pointerdown can cancel an in-flight fling without touching
    // move batching (and vice versa).
    let flingRafId: number | null = null;

    function restoreSnap() {
      if (!el) return;
      el.style.scrollSnapType = "";
    }

    function cancelFling() {
      if (flingRafId !== null) {
        cancelAnimationFrame(flingRafId);
        flingRafId = null;
      }
    }

    function flushPendingScroll() {
      moveRafId = null;
      if (!el || pendingScrollLeft === null) return;
      el.scrollLeft = pendingScrollLeft;
      pendingScrollLeft = null;
    }

    function onPointerDown(e: PointerEvent) {
      // Mouse only, primary button only — a right-click or a stylus tap must
      // not start a drag.
      if (!el || e.pointerType !== "mouse" || e.button !== 0) return;
      // A fresh grab must kill an in-flight fling instantly, otherwise the
      // momentum from the previous flick keeps fighting the new drag.
      cancelFling();
      if (moveRafId !== null) {
        cancelAnimationFrame(moveRafId);
        moveRafId = null;
      }
      pendingScrollLeft = null;
      pointerId = e.pointerId;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      moved = false;
      samples = [{ t: e.timeStamp, x: e.clientX }];
      // Capture keeps the drag alive when the cursor leaves the strip, but it
      // throws if the pointer is already gone by the time this runs — that
      // must not take the handler (and the drag) down with it.
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // Not capturable — the drag still works while the cursor stays inside.
      }
      // The strip carries `scroll-smooth` for the arrow buttons, and that CSS
      // also animates a plain `scrollLeft =` assignment — under the cursor it
      // reads as the strip lagging a moving target. Direct writes go instant
      // for the duration of the drag; the fling (or `stop`, if there is no
      // fling) hands both back.
      el.style.scrollBehavior = "auto";
      // Scroll-snap re-centers the strip on every write otherwise, which
      // reads as the drag being tugged back — see the file-level comment.
      el.style.scrollSnapType = "none";
      el.classList.add("is-dragging");
    }

    function onPointerMove(e: PointerEvent) {
      if (!el || pointerId !== e.pointerId) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      moved = true;
      // Text selection would otherwise start halfway through the drag and the
      // strip would jitter against the selection.
      e.preventDefault();
      samples.push({ t: e.timeStamp, x: e.clientX });
      if (samples.length > VELOCITY_SAMPLE_WINDOW) samples.shift();
      pendingScrollLeft = startScroll - dx;
      if (moveRafId === null) moveRafId = requestAnimationFrame(flushPendingScroll);
    }

    function stop(e: PointerEvent) {
      if (!el || pointerId !== e.pointerId) return;
      pointerId = null;
      el.classList.remove("is-dragging");
      try {
        if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      } catch {
        // Already released — nothing to undo.
      }
      // A pending batched write must land before the fling (or the direct
      // hand-back below) takes over, otherwise the last pointermove is lost.
      if (moveRafId !== null) {
        cancelAnimationFrame(moveRafId);
        moveRafId = null;
        flushPendingScroll();
      }

      // Velocity from the last couple of samples, in px/ms. Fewer than two
      // samples (a click, or a drag that never crossed the threshold) means
      // there's nothing to fling.
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = last && first ? last.t - first.t : 0;
      let speed = dt > 0 && first && last ? (last.x - first.x) / dt : 0;

      if (!moved || Math.abs(speed) < FLING_MIN_SPEED) {
        el.style.scrollBehavior = "";
        restoreSnap();
        return;
      }

      // Fling: decay the velocity every frame and add its distance to
      // scrollLeft, until it drops below the threshold or the strip runs out
      // of room to scroll. Scroll-snap and scroll-behavior stay suspended for
      // the whole animation — restoring them mid-fling would have the browser
      // fight the motion — and are handed back together once it settles.
      let lastFrameTime: number | null = null;
      function step(now: number) {
        if (!el) return;
        const frameDt = lastFrameTime === null ? 16 : now - lastFrameTime;
        lastFrameTime = now;
        el.scrollLeft -= speed * frameDt;
        speed *= FLING_DECAY;
        const atStart = el.scrollLeft <= 0;
        const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth;
        if (Math.abs(speed) < FLING_MIN_SPEED || atStart || atEnd) {
          flingRafId = null;
          el.style.scrollBehavior = "";
          restoreSnap();
          return;
        }
        flingRafId = requestAnimationFrame(step);
      }
      flingRafId = requestAnimationFrame(step);
    }

    // Images and links are natively draggable, so pressing on a card photo and
    // moving started an HTML5 drag of that image: the browser then stops
    // sending pointermove/pointerup entirely and the strip never scrolls — the
    // grab silently did nothing on every card that has a headshot. Nothing
    // inside a scroll strip is meant to be dragged out of the page, so refuse
    // the native drag outright.
    function onDragStart(e: DragEvent) {
      e.preventDefault();
    }

    // Capture phase: the click has to be swallowed before it reaches whatever
    // was under the cursor when the drag ended.
    function onClick(e: MouseEvent) {
      if (!moved) return;
      moved = false;
      e.preventDefault();
      e.stopPropagation();
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", stop);
    el.addEventListener("pointercancel", stop);
    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("click", onClick, true);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", stop);
      el.removeEventListener("pointercancel", stop);
      el.removeEventListener("dragstart", onDragStart);
      el.removeEventListener("click", onClick, true);
      cancelFling();
      if (moveRafId !== null) cancelAnimationFrame(moveRafId);
    };
  }, [ref]);
}
