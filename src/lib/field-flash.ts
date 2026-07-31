/** Scroll to a form field and flash it for a moment.
 *
 *  Used by the "what a brand sees" checklist: clicking an unfilled item used to
 *  jump to the enclosing <section>, which in General (~8 fields) still left the
 *  creator scanning for the empty one. Now it lands on the field itself and
 *  says so visually for ~2s.
 *
 *  The flash is drawn with a ring + tint (see .field-flash in globals.css), not
 *  a border, so nothing reflows by a pixel while it plays. Focus moves into the
 *  first control as well: it makes the target unambiguous for a screen reader,
 *  and it means the creator can start typing without aiming the mouse. */
const FLASH_CLASS = "field-flash";
/** Matches the animation length in globals.css (.field-flash). */
const FLASH_MS = 2200;

export function flashField(anchorId: string) {
  const el = document.getElementById(anchorId);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "center" });

  // Restart the animation if the same field is clicked twice in a row —
  // re-adding a class the element already has does nothing on its own.
  el.classList.remove(FLASH_CLASS);
  void el.offsetWidth;
  el.classList.add(FLASH_CLASS);
  // Timer rather than "animationend": under prefers-reduced-motion the rule
  // sets animation:none, so that event never fires and the mark would stay on
  // the field forever. The timeout clears it either way.
  window.setTimeout(() => el.classList.remove(FLASH_CLASS), FLASH_MS);

  // preventScroll: the browser's own focus scroll would fight the smooth
  // scrollIntoView above and land the field at the very top, under the sticky
  // toolbar. Only text-ish controls are focused — stealing focus into a file
  // picker or a checkbox is more startling than helpful.
  const control = el.querySelector<HTMLElement>(
    "input:not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio]), textarea, select",
  );
  control?.focus({ preventScroll: true });
}
