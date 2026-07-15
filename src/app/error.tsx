"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/** Route-segment error boundary for the public zone. Without this, any
   render-time failure (e.g. a nested redirect crashing the flight tree)
   falls through to Next's built-in global-error overlay — a bare, unstyled
   "This page couldn't load" screen. This gives visitors a friendly, on-brand
   fallback with a real recovery path instead. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold text-foreground">Что-то пошло не так</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Произошла непредвиденная ошибка. Попробуйте ещё раз — обычно это помогает.
      </p>
      <div className="mt-2 flex items-center gap-3">
        <Button variant="primary" size="md" onClick={() => reset()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Попробовать снова
        </Button>
        <Button variant="ghost" size="md" asChild>
          <a href="/">На главную</a>
        </Button>
      </div>
    </Container>
  );
}
