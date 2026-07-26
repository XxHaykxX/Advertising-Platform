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
  boxOfficeDisplay: string;
  status: string;
  applicationDeadline: string | null;
  releaseDate: string | null;
  platforms: string; // JSON string[]; parse with parseStringArray
  placementType: string | null;
  // Sums across the project's sponsorship tiers (null slots count as 0) —
  // powers the "X / Y placements available" indicator on the catalog card.
  // slotsTotal === 0 means no tier has a total set, i.e. hide the indicator.
  slotsAvailable: number;
  slotsTotal: number;
}

export interface ProjectDetailDTO extends ProjectListDTO {
  gallery: string;
  status: string;
  actors: ActorDTO[];
  // ── Press-kit fields (Aram) ──
  tagline: string; // "" when unset
  // Comparable titles. The editor stores [{name,url}] JSON; the public layer
  // used to re-split that JSON on commas (audit 1.1), which printed fragments
  // of the JSON as chips and lost every link. Parsed properly now, so a
  // reference with a url renders as a link.
  references: ReferenceDTO[];
  cinemas: string[]; // exhibition venues, parsed from the comma list
  // Planned release when the project isn't out yet (CSV "Expected Release
  // Date"). ISO string, null when unset.
  expectedReleaseDate: string | null;
  // Production budget, preformatted in the visitor's currency. Distinct from
  // boxOfficeDisplay (gross receipts) — owner decision C.3. "" when unset.
  productionBudgetDisplay: string;
  tiers: TierDTO[]; // sponsorship packages (the productised offer)
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
  priceDisplay: string; // preformatted in the visitor's currency
  benefits: string[]; // parsed from the JSON benefits column
  isExclusive: boolean;
  availableSlots: number | null; // null -> unspecified, don't render a count
  totalSlots: number | null;
}

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
