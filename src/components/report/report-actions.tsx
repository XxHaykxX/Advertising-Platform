"use client";

import { useState } from "react";
import { Printer, Share2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

// Report page action buttons need client-side handlers (window.print,
// navigator.share/clipboard), while report-hero.tsx and investment.tsx stay
// server components. Labels come in as plain strings from the server via
// t(...), so this file never touches makeUI directly.

export function PrintButton({
  label,
  variant,
  size,
  className,
}: { label: string } & ButtonVariantProps & { className?: string }) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn("no-print", className)}
      onClick={() => window.print()}
    >
      <Printer className="mr-1.5 h-4 w-4" />
      {label}
    </Button>
  );
}

export function ShareButton({
  title,
  label,
  copiedLabel,
  variant,
  size,
  className,
}: {
  title: string;
  label: string;
  copiedLabel: string;
} & ButtonVariantProps & { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      // No toast system in the repo yet — swap the label inline for a
      // couple of seconds as a lightweight confirmation.
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked (permissions/insecure context) — no-op
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("no-print", className)}
      onClick={onShare}
      aria-live="polite"
    >
      <Share2 className="mr-1.5 h-4 w-4" />
      {copied ? copiedLabel : label}
    </Button>
  );
}
