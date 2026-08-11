"use client";

import { useEffect } from "react";
import { useStaleChunkReload } from "@/lib/use-stale-chunk-reload";

/** Boundary for failures in the ROOT LAYOUT itself, which `app/error.tsx`
 *  cannot catch — a segment's error boundary wraps that segment's children,
 *  not the layout at its own level.
 *
 *  🔴 That gap swallowed the exact case useStaleChunkReload was written for:
 *  `SmoothScroll` sits in the root layout and lazy-imports `lenis/react`, so
 *  it is the one dynamic chunk fetched on every marketing page. After a
 *  deploy, a tab older than the build asks for a chunk URL that is gone, and
 *  the rejected import went straight past app/error.tsx into Next's bare
 *  built-in overlay — no reload, no recovery.
 *
 *  Replaces the whole document (own <html>/<body>) and does NOT get the root
 *  layout's stylesheet, hence the inline styles. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  useStaleChunkReload(error);

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          background: "#0b0b12",
          color: "#f4f4f5",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Что-то пошло не так</h1>
        <p style={{ maxWidth: "28rem", fontSize: "0.875rem", color: "#a1a1aa", margin: 0 }}>
          Произошла непредвиденная ошибка. Попробуйте ещё раз — обычно это помогает.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              cursor: "pointer",
              borderRadius: "0.75rem",
              border: "none",
              background: "#6366f1",
              color: "#fff",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            Попробовать снова
          </button>
          {/* Plain <a> on purpose: this is the boundary, so a full document
              load is what actually recovers. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              borderRadius: "0.75rem",
              border: "1px solid #3f3f46",
              color: "#f4f4f5",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            На главную
          </a>
        </div>
      </body>
    </html>
  );
}
