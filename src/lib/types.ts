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
  studio: string;
  countries: string;
  ageRating: string; // content rating badge ("16+", "18+"); "" when unset
  applicationDeadline: string | null;
  // True for an open-ended call for offers (IA-42) — applicationDeadline is
  // always null alongside this; render an "Ongoing" label instead of a date.
  applicationDeadlineOngoing: boolean;
  releaseDate: string | null;
  // How much of releaseDate to actually show — "DAY" | "MONTH" | "YEAR"
  // (IA-42). Never render a finer grain than this says was saved.
  releasePrecision: string;
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
  /** The distinct integration kinds this project's placements carry
   *  (2026-08-10), in PLACEMENT_TYPE_VALUES order — the card's chip row and
   *  the catalog's subtype facet both read this. Empty when nothing on the
   *  project is classified, which is the state of every pre-2026-08-10 row. */
  placementTypes: string[];
  /** The cheapest thing this project sells, already formatted in the visitor's
   *  currency (2026-08-05) — same preformatted-on-the-server contract as
   *  productionBudgetDisplay below, so the three components that render a card
   *  don't each have to be handed the daily FX rates.
   *
   *  A marketplace card without a price is a listing a buyer cannot compare,
   *  which is why this exists. "" means nothing here carries a price at all —
   *  every placement and package is "on request" — and the card says so
   *  rather than printing a bare currency symbol. */
  priceFromDisplay: string;
  /** The same "from" figure, split by what it actually buys (2026-08-05). The
   *  card sells two different things — an in-story placement and a sponsorship
   *  package — and one combined minimum could not say which of them cost that
   *  much, while the slot counter next to it came from the packages alone. Each
   *  product line now carries its own count and its own price. "" when that
   *  line has nothing priced. */
  placementsPriceFromDisplay: string;
  tiersPriceFromDisplay: string;
  /** How many sponsorship packages the project sells — the companion to
   *  placementsCount above. */
  tiersCount: number;
}

export interface ProjectDetailDTO extends ProjectListDTO {
  gallery: string;
  /** "/uploads/…" path to the optional sales deck a brand can download from the
   *  project page (IA-44, 2026-08-05); "" when none was attached. */
  presentationPdf: string;
  actors: ActorDTO[];
  // ── Press-kit fields (Aram) ──
  tagline: string; // "" when unset
  // Comparable titles. The editor stores [{name,url}] JSON; the public layer
  // used to re-split that JSON on commas (audit 1.1), which printed fragments
  // of the JSON as chips and lost every link. Parsed properly now, so a
  // reference with a url renders as a link.
  references: ReferenceDTO[];
  cinemas: string[]; // exhibition venues, parsed from the comma list
  // Production budget, preformatted in the visitor's currency (owner decision
  // C.3, distinct from the box-office gross column dropped on 2026-08-04).
  // "" when unset.
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
  // Nullable since 2026-08-04 — same contract as PlacementDTO.priceAmd
  // below: null means the creator left it unpriced and the storefront shows
  // "on request" instead of a made-up number.
  priceAmd: number | null; // raw AMD — lets the offer summary compare tiers with placements
  priceDisplay: string | null; // preformatted in the visitor's currency; null when priceAmd is null
  // The same price in AMD — the currency the creator actually set. The
  // converted figure is fine for browsing, but an application is a commitment,
  // so the popup quotes the deal currency (2 500 000 ֏, not €5 988, a number
  // that would read differently tomorrow).
  priceNative: string | null; // null when priceAmd is null
  benefits: string[]; // parsed from the JSON benefits column
  image: string | null; // uploaded still path ("/uploads/…"), same contract as PlacementDTO.image; null when none
  isExclusive: boolean;
  availableSlots: number | null; // null -> unspecified, don't render a count
  totalSlots: number | null;
}

export type PlacementDTO = {
  id: number;
  title: string;
  /** Which of the four integration kinds this offer is — one of
   *  PLACEMENT_TYPE_VALUES, or "" when the creator never classified it (every
   *  row written before 2026-08-10). "" renders no chip; it is not an error. */
  placementType: string;
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

/** One piece of advertising inventory outside a film — a billboard, a lift
 *  panel, a radio slot (stage 3, 2026-08-10). The list shape: everything the
 *  channel showcase card needs, already localized and priced in the visitor's
 *  currency, same preformatted-on-the-server contract as ProjectListDTO. */
export interface AdSpaceListDTO {
  id: number;
  code: string;
  /** AD_CHANNELS code — the channel this space belongs to. */
  channel: string;
  title: string;
  /** City + address, joined for display; "" when neither was filled. */
  location: string;
  /** "3×6 м", "30 сек" — the unit differs per channel, so it is free text. */
  sizeFormat: string;
  /** Audience or traffic per day; null when the owner gave no figure. */
  reachPerDay: number | null;
  image: string;
  /** Cheapest offer on this space, preformatted; "" when everything here is
   *  "on request". */
  priceFromDisplay: string;
  offersCount: number;
}

export interface AdSpaceDetailDTO extends AdSpaceListDTO {
  /** Cleared moderation and not hidden — the public card refuses to render
   *  anything else, while the owner's cabinet and the admin preview pass
   *  activeOnly=false and see a DRAFT. */
  publiclyVisible: boolean;
  description: string[];
  gallery: string[];
  sides: number | null;
  availableFrom: string | null;
  availableTo: string | null;
  offers: AdSpaceOfferDTO[];
}

export interface AdSpaceOfferDTO {
  id: number;
  name: string;
  /** What the price buys — "месяц", "кампания"; "" when unset. */
  period: string;
  priceAmd: number | null; // null -> "on request", same contract as PlacementDTO
  priceDisplay: string | null;
  priceNative: string | null;
  availableSlots: number | null;
  totalSlots: number | null;
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
