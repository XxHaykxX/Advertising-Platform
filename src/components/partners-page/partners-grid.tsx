import type { PartnerDTO } from "@/lib/types";
import { Reveal } from "@/components/ui/reveal";
import { PartnerMark } from "./partner-mark";

/* Presentation-only taglines keyed by partner name — the DB record only
   stores name/logo/url, so short descriptions are curated here. */
const TAGLINE: Record<string, string> = {
  "Verita Vertical": "Vertical-format drama studio producing character-driven mobile series.",
  "Helix Stories": "Serialized storytelling banner behind multi-season microdrama arcs.",
  "Echo Microdrama": "Rapid-turnaround production house built for short-form platforms.",
  "Nova Frame": "Boutique studio focused on high-concept vertical thrillers.",
  "Amber Lane": "Independent studio crafting romance and family-drama vertical series.",
  Ridgeline: "Production partner specializing in action and suspense microdramas.",
  "Kinodaran Studios": "In-house studio behind the iGovazd catalog of original productions.",
  "Prism Vertical Network": "Distribution network syndicating vertical drama across regional platforms.",
};
const DEFAULT_TAGLINE = "Production and distribution partner in the iGovazd network.";

export function PartnersGrid({ partners }: { partners: PartnerDTO[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {partners.map((p, idx) => {
        const className =
          "flex flex-col rounded-2xl border border-border bg-card p-6 card-lift transition-all hover:border-primary/40";
        const card = (
          <>
            <PartnerMark p={p} />
            <h3 className="mt-4 font-semibold text-foreground">{p.name}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {TAGLINE[p.name] ?? DEFAULT_TAGLINE}
            </p>
          </>
        );
        return (
          <Reveal key={p.id} delay={(idx % 4) * 0.08}>
            {p.url ? (
              <a href={p.url} target="_blank" rel="noopener noreferrer" className={className}>
                {card}
              </a>
            ) : (
              <div className={className}>{card}</div>
            )}
          </Reveal>
        );
      })}
    </div>
  );
}
