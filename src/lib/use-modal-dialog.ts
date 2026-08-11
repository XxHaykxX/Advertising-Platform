"use client";

import { useEffect, type RefObject } from "react";
import { lockBodyScroll } from "@/lib/body-scroll-lock";

/** The three things a hand-rolled modal owes a keyboard or screen-reader user,
 *  none of which come free with `role="dialog"`:
 *
 *   1. Focus starts inside it. Without this the caret stays on `<body>` and
 *      reaching the first field means tabbing through the ~60 elements of the
 *      page underneath.
 *   2. Tab stays inside it. Without this the third Tab leaves the dialog and
 *      lands on links the backdrop is covering.
 *   3. Focus goes back where it came from on close, so the page doesn't jump
 *      to the top and the trigger is still under the caret.
 *
 *  Plus the page behind stops scrolling while it is open — a wheel over the
 *  backdrop used to scroll the report, not the dialog.
 *
 *  `panelRef` is the dialog's own box (not the backdrop). Give it
 *  `tabIndex={-1}` so there is something to focus when it holds no fields
 *  yet. Mount the component only while the dialog is open — the hook does its
 *  work on mount and undoes it on unmount. */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** `ready` is for dialogs that portal into <body> and therefore render nothing
 *  on their first commit (they wait for a `mounted` flag, since document.body
 *  doesn't exist during SSR). The effect below reads `panelRef.current` once,
 *  and a ref object never changes identity — so on those dialogs it ran while
 *  the panel was still null and then never again: no initial focus, and the
 *  Tab handler bailing out on every key. Passing the same flag as `ready`
 *  re-runs it the moment the panel is really there. Dialogs that render their
 *  panel on the first commit can leave it out. */
export function useModalDialog(panelRef: RefObject<HTMLElement | null>, ready = true) {
  useEffect(() => {
    if (!ready) return;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Shared counter (body-scroll-lock.ts), which also carries the
    // scrollbar-width padding compensation this hook used to own.
    const releaseScroll = lockBodyScroll();

    // Re-queried on every Tab rather than captured once: this dialog swaps its
    // whole form for a success message, and a stale list would trap focus on
    // elements that no longer exist.
    const focusable = () =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];

    // The dialog box itself takes focus, not its first field. Landing on a
    // field skips the title the visitor needs to hear first, and when that
    // field is a <select> the browser's own picker can open and swallow every
    // key after it. From here one Tab reaches the first field.
    (panel ?? focusable()[0])?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab" || !panel) return;
      const items = focusable();
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const outside = !panel.contains(active);
      if (e.shiftKey ? active === first || outside : active === last || outside) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    }

    // Capture phase: the dialog's own fields must not get to act on the Tab
    // before the wrap-around decision is made.
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      releaseScroll();
      // The trigger may itself have been unmounted while the dialog was open.
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [panelRef, ready]);
}
