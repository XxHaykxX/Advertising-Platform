"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { addFavorite, removeFavorite } from "@/app/account/brand/favorite-actions";

/** Private brand shortlist heart (#22) — top-right of every project card.
 *  Guest → link to /login (no write attempt). BRAND → toggles addFavorite/
 *  withdrawFavorite via useTransition, same "no manual optimistic state,
 *  local pending flag is enough" pattern as ExpressInterestButton
 *  (browse-view.tsx), except here the flip on `ok` is immediate since the
 *  revalidatePath in the action refreshes the page's own data anyway.
 *  Creator/staff → rendered but inert (disabled, greyed). Own listing (dual
 *  member) → also inert, but with `ownAria` instead of `addAria` (QA-4): the
 *  disabled heart otherwise still announced "Add to favorites", an action
 *  that was never going to work on a project the visitor owns. */
export function FavoriteHeart({
  projectId,
  initialFavorite,
  canFavorite,
  signedIn,
  addAria,
  removeAria,
  variant = "overlay",
}: {
  projectId: number;
  initialFavorite: boolean;
  canFavorite: boolean;
  /** True when the signed-in visitor is this project's own creator/brand
   *  side — the reason `canFavorite` is false, distinct from "not a brand at
   *  all" (which keeps `addAria`, since favoriting is merely off-limits, not
   *  nonsensical, for that visitor). */
  isOwn?: boolean;
  signedIn: boolean;
  addAria: string;
  removeAria: string;
  ownAria: string;
  /** "overlay" is the round heart floating over a card's poster. "inline" is
   *  the labelled button in the project page toolbar, added 2026-08-14: the
   *  page a visitor reaches by clicking a card had no way to save the project
   *  the card itself could save. Same actions, same states — only the chrome
   *  and the visible label differ. */
  variant?: "overlay" | "inline";
}) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, startTransition] = useTransition();

  const overlay = variant === "overlay";
  // z-20 (not z-10) — project-card.tsx layers a whole-card overlay Link at
  // z-10 over the poster for the card-wide click target, so the heart needs
  // to sit above that to stay clickable; z-20 is harmless where there's no
  // such overlay (browse-view.tsx's BrowseCard).
  const shellClass = overlay
    ? "absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/30 backdrop-blur transition-colors hover:bg-black/40"
    : // Matches the Share / Print buttons it sits beside (Button variant
      // "secondary", size "sm") without pulling Button in — this file has to
      // stay a leaf client component.
      "no-print inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary";
  // Over a poster the icon sits on a dark scrim; in the toolbar it sits on the
  // page background and has to follow the text colour instead.
  const iconTone = overlay ? "text-white" : "";
  const caption = (label: string) => (overlay ? null : <span>{label}</span>);

  if (!signedIn) {
    return (
      <Link href="/login" aria-label={addAria} className={shellClass}>
        <Heart className={cn("h-4 w-4", iconTone)} />
        {caption(addAria)}
      </Link>
    );
  }

  // IA-59: nothing at all, rather than a greyed-out heart. A shortlist belongs
  // to a buyer; a creator — and a dual member looking at their own listing —
  // can never add to one, so the control had no reachable state and QA filed
  // the dead affordance as "Heart button inactive". `isOwn`/`ownAria` stay in
  // the props so the call sites don't have to change, but nothing reads them
  // now: they only ever labelled this disabled button.
  if (!canFavorite) return null;

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={favorite ? removeAria : addAria}
      className={shellClass}
      onClick={() =>
        startTransition(async () => {
          const res = favorite ? await removeFavorite(projectId) : await addFavorite(projectId);
          if (res.ok) setFavorite(!favorite);
        })
      }
    >
      {pending ? (
        <Loader2 className={cn("h-4 w-4 animate-spin", iconTone)} />
      ) : (
        <Heart className={cn("h-4 w-4", favorite ? "fill-danger text-danger" : iconTone)} />
      )}
      {caption(favorite ? removeAria : addAria)}
    </button>
  );
}
