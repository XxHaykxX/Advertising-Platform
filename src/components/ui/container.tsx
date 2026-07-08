import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mx-auto w-full max-w-[1200px] px-6 max-sm:px-4", className)} {...props}>
      {children}
    </div>
  );
}
