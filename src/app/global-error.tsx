"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useStaleChunkReload } from "@/lib/use-stale-chunk-reload";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n-base";

/* This boundary replaces the root layout, so there is no <I18nProvider> to read
   and no `t()` to call — the three strings are inlined. They used to be Russian
   literals with a hard-coded `lang="ru"`, which is what an Armenian visitor was
   shown when the layout failed (IA-57). The locale comes off the same cookie
   the server reads, on the client, because that is all this boundary has. */
const COPY: Record<Locale, { title: string; body: string; retry: string; home: string }> = {
  ru: {
    title: "Что-то пошло не так",
    body: "Произошла непредвиденная ошибка. Попробуйте ещё раз — обычно это помогает.",
    retry: "Попробовать снова",
    home: "На главную",
  },
  en: {
    title: "Something went wrong",
    body: "An unexpected error occurred. Try again — that usually fixes it.",
    retry: "Try again",
    home: "Go to home page",
  },
  hy: {
    title: "Ինչ-որ բան այն չէ",
    body: "Տեղի ունեցավ անսպասելի սխալ։ Փորձեք նորից — սովորաբար դա օգնում է։",
    retry: "Փորձել նորից",
    home: "Գլխավոր էջ",
  },
};

function readLocaleCookie(): Locale {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${LOCALE_COOKIE}=`));
  const value = hit?.slice(LOCALE_COOKIE.length + 1);
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** The cookie can't change while this screen is up — nothing to subscribe to.
 *  Module scope so the identity stays stable across renders. */
const noSubscribe = () => () => {};
const serverLocale = () => DEFAULT_LOCALE;

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

  // useSyncExternalStore, not useState+useEffect: this component is rendered
  // on the server too, where there is no cookie, so the server snapshot is the
  // default and the client swaps in the real one without a hydration mismatch.
  const locale = useSyncExternalStore(noSubscribe, readLocaleCookie, serverLocale);
  const copy = COPY[locale];

  return (
    <html lang={locale}>
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
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{copy.title}</h1>
        <p style={{ maxWidth: "28rem", fontSize: "0.875rem", color: "#a1a1aa", margin: 0 }}>
          {copy.body}
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
            {copy.retry}
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
            {copy.home}
          </a>
        </div>
      </body>
    </html>
  );
}
