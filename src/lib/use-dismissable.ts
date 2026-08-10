"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

/** Outside click/touch + Escape close an open panel. Third copy of this exact
 *  pattern (LocaleSwitcher, CurrencySwitcher, UserMenu) was the signal to stop
 *  copying it — see the plan's C1. Only the "when to close" logic moves here;
 *  each caller keeps its own markup.
 *
 *  Escape also returns focus to `triggerRef` (if given) — outside clicks don't,
 *  since the user's focus is already wherever they just clicked. */
export function useDismissable(
  open: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
  triggerRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      onClose();
      triggerRef?.current?.focus();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, containerRef, triggerRef]);
}
