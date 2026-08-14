"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useLocale, useUI } from "@/lib/i18n-client";
import { useStaleChunkReload } from "@/lib/use-stale-chunk-reload";

/** Route-segment error boundary for the public zone. Without this, any
   render-time failure (e.g. a nested redirect crashing the flight tree)
   falls through to Next's built-in global-error overlay — a bare, unstyled
   "This page couldn't load" screen. This gives visitors a friendly, on-brand
   fallback with a real recovery path instead.

   Localised since 2026-08-14 (QA pass): the three strings were hardcoded in
   Russian on a site whose default language is Armenian. This boundary renders
   inside the root layout, so the <I18nProvider> is mounted and useLocale can
   tell us who is looking; global-error.tsx replaces that layout and therefore
   keeps its hardcoded copy. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const t = useUI(locale);

  useEffect(() => {
    console.error(error);
  }, [error]);
  useStaleChunkReload(error);

  return (
    <Container className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold text-foreground">{t("error.title")}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{t("error.body")}</p>
      <div className="mt-2 flex items-center gap-3">
        <Button variant="primary" size="md" onClick={() => reset()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {t("error.retry")}
        </Button>
        <Button variant="ghost" size="md" asChild>
          {/* Deliberately a plain <a>, not <Link>: this is the error boundary,
              so the router state we would navigate with is the state that just
              failed. A full document load is the point. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">{t("legal.backToHome")}</a>
        </Button>
      </div>
    </Container>
  );
}
