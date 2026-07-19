"use client";

/** Fixes IA-8/IA-9 — the sidebar's "My Interests" badge (brand-sidebar.tsx)
 *  only re-fetches getInterestCount() on route change (its useEffect deps
 *  are `[pathname]`), so adding (ExpressInterestButton, browse/browse-view.tsx)
 *  or removing (RemoveInterestButton, interests/remove-interest-button.tsx)
 *  an interest on the *same* page never updated the count without a full
 *  reload. Both buttons call emitInterestChanged() once their Server Action
 *  resolves `ok`, and the sidebar listens for it and re-fetches the count
 *  from the server (source of truth) — no local increment/decrement, so
 *  there's no risk of double-counting. */
export const INTEREST_CHANGED_EVENT = "brand:interest-changed";

export function emitInterestChanged() {
  window.dispatchEvent(new Event(INTEREST_CHANGED_EVENT));
}
