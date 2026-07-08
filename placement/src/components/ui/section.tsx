import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  muted?: boolean;
  id?: string;
}

export function Section({ className, muted, id, children, ...props }: SectionProps) {
  return (
    <section
      id={id}
      className={cn("py-20 md:py-24 max-sm:py-14", muted && "bg-section", className)}
      {...props}
    >
      {children}
    </section>
  );
}
