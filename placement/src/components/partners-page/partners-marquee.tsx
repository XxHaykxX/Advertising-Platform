import type { PartnerDTO } from "@/lib/types";
import { PartnerMark } from "./partner-mark";

function LogoPill({ p }: { p: PartnerDTO }) {
  const className =
    "group/chip mx-3 inline-flex shrink-0 items-center gap-3 rounded-xl border border-border bg-card px-6 py-4 transition-all duration-300 hover:border-primary/40 hover:shadow-sm";
  const content = (
    <>
      <PartnerMark p={p} size="sm" />
      <span className="text-base font-semibold tracking-tight text-foreground">{p.name}</span>
    </>
  );
  if (p.url) {
    return (
      <a href={p.url} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return <div className={className}>{content}</div>;
}

function MarqueeRow({
  items,
  direction,
  duration,
}: {
  items: PartnerDTO[];
  direction: "left" | "right";
  duration: number;
}) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee-row relative flex overflow-hidden">
      <div
        className="marquee-x flex w-max"
        style={{
          animationName: direction === "right" ? "marquee-right" : "marquee-left",
          animationDuration: `${duration}s`,
        }}
      >
        {doubled.map((p, i) => (
          <LogoPill key={`${p.id}-${i}`} p={p} />
        ))}
      </div>
    </div>
  );
}

/* Continuous horizontal logo marquee, split into two rows moving in
   opposite directions. Pauses on hover; disabled under reduced motion
   via the .marquee-x rules in globals.css. */
export function PartnersMarquee({ partners }: { partners: PartnerDTO[] }) {
  if (partners.length === 0) return null;
  const half = Math.ceil(partners.length / 2);
  const rowA = partners.slice(0, half);
  const rowB = partners.length > 1 ? partners.slice(half) : rowA;

  return (
    <div className="relative space-y-5 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <MarqueeRow items={rowA} direction="left" duration={36} />
      <MarqueeRow items={rowB} direction="right" duration={42} />
    </div>
  );
}
