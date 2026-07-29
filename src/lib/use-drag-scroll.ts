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
 *  cursor. */
const DRAG_THRESHOLD_PX = 5;

export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let moved = false;

    function onPointerDown(e: PointerEvent) {
      // Mouse only, primary button only — a right-click or a stylus tap must
      // not start a drag.
      if (!el || e.pointerType !== "mouse" || e.button !== 0) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      moved = false;
      // Capture keeps the drag alive when the cursor leaves the strip, but it
      // throws if the pointer is already gone by the time this runs — that
      // must not take the handler (and the drag) down with it.
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // Not capturable — the drag still works while the cursor stays inside.
      }
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
      el.scrollLeft = startScroll - dx;
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
    el.addEventListener("click", onClick, true);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", stop);
      el.removeEventListener("pointercancel", stop);
      el.removeEventListener("click", onClick, true);
    };
  }, [ref]);
}
