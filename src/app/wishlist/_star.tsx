'use client';

import * as React from 'react';

import { toggleWishlistEntry } from './_actions';

interface Props {
  listingId: string;
  isSaved: boolean;
  /** Optional className to override positioning. */
  className?: string;
}

/**
 * Star toggle for the wishlist. The form lives inside the catalog card, so
 * the click must not bubble up to the parent <Link> that wraps the card body.
 * stopPropagation on the form click does the trick — useFormState would be
 * overkill for a single boolean.
 */
export function WishlistStar({ listingId, isSaved, className }: Props) {
  return (
    <form
      action={toggleWishlistEntry}
      onClick={(e) => e.stopPropagation()}
      className={className ?? 'absolute right-3 top-3'}
    >
      <input type="hidden" name="listingId" value={listingId} />
      <input
        type="hidden"
        name="intent"
        value={isSaved ? 'remove' : 'add'}
      />
      <button
        type="submit"
        aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        className={`inline-flex size-8 items-center justify-center rounded-full border transition ${
          isSaved
            ? 'border-accent/40 bg-accent/15 text-accent hover:bg-accent/25'
            : 'border-border-subtle bg-surface text-tertiary hover:border-border-strong hover:text-primary'
        }`}
      >
        {/* Inline svg — Lucide's <Star> imports add bytes we don't need here */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={isSaved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>
    </form>
  );
}
