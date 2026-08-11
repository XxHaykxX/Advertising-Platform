"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Share2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

// Returns the user to wherever they came from (catalog, portfolio, favorites,
// featured …) instead of a hardcoded /catalog (IA-14). Falls back to /catalog
// when there's no in-app history (e.g. a shared deep link opened cold).
// IA-54: the word itself is not rendered any more — an arrow already reads as
// "back", and next to it sat "Հետ Կատալոգ", two words for one action. `label`
// becomes the accessible name instead of visible text, so the control keeps
// telling a screen reader what it does.
export function BackButton({ label, fallbackHref = "/catalog" }: { label: string; fallbackHref?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      // Was inline-flex with a text label; with the icon alone the tap target
      // would collapse to 16px, hence the fixed box (still under the 24px the
      // surrounding line is tall, so the row doesn't grow).
      className="-ml-1 grid h-6 w-6 place-items-center rounded-md text-foreground transition-colors hover:text-primary"
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}

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
