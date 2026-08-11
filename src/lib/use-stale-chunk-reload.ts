"use client";

import { useEffect } from "react";

/** How long to wait before a second automatic reload is allowed. Long enough
 *  that a genuinely broken deploy can't put the tab in a reload loop, short
 *  enough that a tab left open across two deploys still recovers by itself. */
const RETRY_AFTER_MS = 30_000;
const KEY = "chunkReloadAt";

/** True for the "the JS file this page asked for is no longer on the server"
 *  family of failures. webpack names its own error `ChunkLoadError`; native
 *  ESM imports (and Safari) phrase it differently, hence the message test. */
export function isStaleChunkError(error: Error): boolean {
  return (
    error.name === "ChunkLoadError" ||
    /Loading (CSS )?chunk|dynamically imported module|Importing a module script failed/i.test(
      error.message ?? ""
    )
  );
}

/** Recovery for a document that outlived its deploy. Every lazily-imported
 *  component (the mobile nav panel, the media picker, …) fetches its chunk on
 *  first use; if the build that produced those chunks has since been replaced,
 *  the fetch 404s and the error boundary opens. `reset()` cannot help there —
 *  it re-runs the same import against the same missing URL — so the boundary
 *  reloads the document instead, which pulls the current build's HTML and
 *  chunk names. Anything that is not a chunk error renders the normal
 *  boundary UI untouched. */
export function useStaleChunkReload(error: Error): void {
  useEffect(() => {
    if (!isStaleChunkError(error)) return;
    let last = 0;
    try {
      last = Number(sessionStorage.getItem(KEY)) || 0;
      // Private-mode Safari throws on write; a failed guard would mean an
      // unguarded reload loop, so bail out rather than reload blind.
      sessionStorage.setItem(KEY, String(Date.now()));
    } catch {
      return;
    }
    if (Date.now() - last < RETRY_AFTER_MS) return;
    window.location.reload();
  }, [error]);
}
