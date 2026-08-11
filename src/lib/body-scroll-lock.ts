"use client";

import { useEffect } from "react";

/** One ref-counted lock on the page scroll, shared by everything that covers
 *  the page: the catalogue's filter sheet, the burger menu, every modal
 *  dialog, the portfolio lightbox.
 *
 *  🔴 Each of those used to save and restore `body.style.overflow` on its own,
 *  which is only correct while exactly one of them is open. On mobile
 *  /catalog: open the filter sheet (saves `""`, sets `hidden`) → open the
 *  burger menu (saves `"hidden"`, sets `hidden`) → close the filter sheet →
 *  it restores `""` and the page scrolls under the still-open menu. The
 *  lightbox was worse: it restored `""` unconditionally, whatever it found.
 *
 *  Counting instead: the first lock takes the snapshot, the last release puts
 *  it back, and the order the callers open and close in stops mattering. */
let locks = 0;
let prevOverflow = "";
let prevPaddingRight = "";

export function lockBodyScroll(): () => void {
  const body = document.body;
  if (locks === 0) {
    prevOverflow = body.style.overflow;
    prevPaddingRight = body.style.paddingRight;
    // Removing the scrollbar shifts the whole page a few pixels to the right;
    // the same width as padding keeps it still. (Came from useModalDialog,
    // which was the only one of the four doing this.)
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
  }
  locks++;

  let released = false;
  return () => {
    // Idempotent: React 18 StrictMode runs an effect's cleanup twice in dev,
    // and a double decrement would unlock the page with a dialog still open.
    if (released) return;
    released = true;
    locks--;
    if (locks === 0) {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    }
  };
}

/** Hook form for components that lock while a flag is true. */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    return lockBodyScroll();
  }, [active]);
}
