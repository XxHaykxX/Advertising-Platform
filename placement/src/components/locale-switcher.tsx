"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n";
import { setLocale } from "@/lib/actions/locale";
import { cn } from "@/lib/utils";

/** RU / EN / HY pill group. Pass `onDark` when floating over the cinematic
 *  hero (see header.tsx for the same light-on-dark convention). */
export function LocaleSwitcher({
  current,
  onDark = false,
  className,
}: {
  current: Locale;
  onDark?: boolean;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function changeLocale(l: Locale) {
    if (l === current) return;
    startTransition(async () => {
      await setLocale(l);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "flex items-center gap-1 rounded-full p-1 transition-colors",
        onDark ? "bg-white/10" : "bg-muted",
        pending && "opacity-70",
        className
      )}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => changeLocale(l)}
          disabled={pending}
          aria-current={current === l}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold uppercase transition-all disabled:cursor-not-allowed",
            current === l
              ? "bg-primary text-primary-foreground"
              : onDark
                ? "text-white/60 hover:text-white"
                : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
