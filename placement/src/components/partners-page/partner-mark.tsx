import type { PartnerDTO } from "@/lib/types";

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/* Partner visual mark: real logo if uploaded, otherwise a generated
   monogram (initials on an indigo gradient circle) as a placeholder. */
export function PartnerMark({ p, size = "md" }: { p: PartnerDTO; size?: "sm" | "md" }) {
  if (p.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={p.logo}
        alt={p.name}
        className={size === "sm" ? "h-7 w-auto object-contain" : "h-10 w-auto object-contain"}
      />
    );
  }
  return (
    <div
      className={
        size === "sm"
          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          : "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      }
      style={{ background: "var(--grad)" }}
      aria-hidden
    >
      {initials(p.name)}
    </div>
  );
}
