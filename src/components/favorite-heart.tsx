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
  isOwn = false,
  signedIn,
  addAria,
  removeAria,
  ownAria,
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
}) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, startTransition] = useTransition();

  // z-20 (not z-10) — project-card.tsx layers a whole-card overlay Link at
  // z-10 over the poster for the card-wide click target, so the heart needs
  // to sit above that to stay clickable; z-20 is harmless where there's no
  // such overlay (browse-view.tsx's BrowseCard).
  const shellClass =
    "absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/30 backdrop-blur transition-colors hover:bg-black/40";

  if (!signedIn) {
    return (
      <Link href="/login" aria-label={addAria} className={shellClass}>
        <Heart className="h-4 w-4 text-white" />
      </Link>
    );
  }

  if (!canFavorite) {
    return (
      <button
        type="button"
        disabled
        aria-label={isOwn ? ownAria : addAria}
        className={cn(shellClass, "cursor-not-allowed opacity-50")}
      >
        <Heart className="h-4 w-4 text-white" />
      </button>
    );
  }

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
        <Loader2 className="h-4 w-4 animate-spin text-white" />
      ) : (
        <Heart className={cn("h-4 w-4", favorite ? "fill-danger text-danger" : "text-white")} />
      )}
    </button>
  );
}
