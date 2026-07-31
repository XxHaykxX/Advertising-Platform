export interface ProjectListDTO {
  id: number;
  code: string;
  title: string;
  genre: string; // primary genre — the display value cards have always used
  // Every genre the project carries. The editor has been a multi-select for a
  // while, but only genres[0] ever reached the storefront, so the rest were
  // invisible and unfilterable (audit 5.6).
  genres: string[];
  synopsis: string;
  poster: string;
  format: string;
  formatCategory: string; // marketing format bucket (FEATURE|SERIES|…); "" when unset
  language: string; // primary language (Armenian|Russian|…); "" when unset
  studio: string;
  countries: string;
  ageRating: string; // content rating badge ("16+", "18+"); "" when unset
  // Preformatted (converted + symbol) by the data layer — a single formatting
  // point so display components never touch currency math. "" when unset.
  // NOT rendered anywhere since 2026-07-27 (the field was removed from the
  // editors and the storefront at the owner's request); kept so the stored
  // figures aren't lost and bringing the display back is a one-line change.
  boxOfficeDisplay: string;
  applicationDeadline: string | null;
  releaseDate: string | null;
  platforms: string; // JSON string[]; parse with parseStringArray
  // Sums across the project's sponsorship tiers (null slots count as 0) —
  // powers the "X / Y placements available" indicator on the catalog card.
  // slotsTotal === 0 means no tier has a total set, i.e. hide the indicator.
  slotsAvailable: number;
  slotsTotal: number;
  // How many product placement rows the project has (owner request
  // 2026-07-28) — powers the "N placements" badge on the catalog card.
  // Counted from real rows, so a project with none renders nothing.
  placementsCount: number;
}

export interface ProjectDetailDTO extends ProjectListDTO {
  gallery: string;
  actors: ActorDTO[];
  // ── Press-kit fields (Aram) ──
  tagline: string; // "" when unset
  // Comparable titles. The editor stores [{name,url}] JSON; the public layer
  // used to re-split that JSON on commas (audit 1.1), which printed fragments
  // of the JSON as chips and lost every link. Parsed properly now, so a
  // reference with a url renders as a link.
  references: ReferenceDTO[];
  cinemas: string[]; // exhibition venues, parsed from the comma list
  // Production budget, preformatted in the visitor's currency. Distinct from
  // boxOfficeDisplay (gross receipts) — owner decision C.3. "" when unset.
  productionBudgetDisplay: string;
  tiers: TierDTO[]; // sponsorship packages (the productised offer)
  // Product placement (owner correction 2026-07-28) — the brand INSIDE the
  // story, distinct from the sponsorship tiers above (a logo-on-materials
  // deal). Rendered above them on the report (sortOrder asc).
  placements: PlacementDTO[];
  milestones: MilestoneDTO[]; // Ф4/#27 production-timeline nodes (sortOrder asc)
  // ── Video (#10) — rendered near the top of the report page ──
  videoEmbedUrl: string; // YouTube/Vimeo URL; "" when unset
  videoFile: string; // uploaded MP4 path; "" when unset
}

export interface ReferenceDTO {
  name: string;
  url: string; // "" when the reference carries no link
  media: string; // uploaded image/video path ("/uploads/…"), "" when none
}

export interface ActorDTO {
  id: number;
  name: string;
  role: string; // legacy single role — kept as a fallback for old readers
  roles: string[]; // Ф3 multi-role (one person can be Actor+Producer+…)
  kind: string; // "CAST" | "CREW"
  photo: string; // uploaded headshot path, "" when none
}

export interface TierDTO {
  id: number;
  name: string;
  priceAmd: number; // raw AMD — lets the offer summary compare tiers with placements
  priceDisplay: string; // preformatted in the visitor's currency
  // The same price in AMD — the currency the creator actually set. The
  // converted figure is fine for browsing, but an application is a commitment,
  // so the popup quotes the deal currency (2 500 000 ֏, not €5 988, a number
  // that would read differently tomorrow).
  priceNative: string;
  benefits: string[]; // parsed from the JSON benefits column
  image: string | null; // uploaded still path ("/uploads/…"), same contract as PlacementDTO.image; null when none
  isExclusive: boolean;
  availableSlots: number | null; // null -> unspecified, don't render a count
  totalSlots: number | null;
}

export type PlacementDTO = {
  id: number;
  title: string;
  description: string[]; // parsed from the JSON description column, one item per line — same convention as TierDTO.benefits
  image: string | null; // uploaded still path ("/uploads/…"), null when none
  priceAmd: number | null; // raw AMD; null when the creator left it empty ("on request")
  priceDisplay: string | null; // preformatted in the visitor's currency, same as TierDTO.priceDisplay; null when priceAmd is null
  priceNative: string | null; // in AMD, the currency the creator set — see TierDTO.priceNative; null when priceAmd is null
  availableSlots: number | null; // null -> unspecified, don't render a count
  totalSlots: number | null;
};

export interface MilestoneDTO {
  id: number;
  label: string; // free-text stage name
  date: string | null; // ISO date, null when unset
  note: string; // one free-text line, "" when unset
  isActive: boolean; // the current stage — highlighted on the timeline
}

export interface PortfolioDTO {
  id: number;
  title: string;
  brand: string;
  description: string;
  image: string | null;
  metrics: string; // JSON object; parse on demand
}

export interface PartnerDTO {
  id: number;
  name: string;
  logo: string | null;
  url: string | null;
}
