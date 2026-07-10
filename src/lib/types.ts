export interface OpportunityDTO {
  sceneNo: number;
  description: string;
  mood: string;
  rationale: string;
  type: string;
  prominence: string;
  category: string;
  estValue: number;
  durationSec: number;
}

export interface ProjectListDTO {
  id: number;
  code: string;
  title: string;
  genre: string;
  synopsis: string;
  poster: string;
  format: string;
  studio: string;
  countries: string;
  audienceGender: string;
  audienceAge: string;
  projViews: string;
  // Budget is preformatted (converted + symbol) by the data layer — a single
  // formatting point so display components never touch currency math.
  budgetDisplay: string; // "" when both bounds are unset
  // Raw AMD bounds, alongside budgetDisplay, for numeric filtering/sorting
  // (catalog budget filter) — always AMD regardless of the chosen currency.
  budgetMinAmd: number | null;
  budgetMaxAmd: number | null;
  status: string;
  opportunitiesCount: number;
  productCategories: string[];
  slotsTotal: number;
  slotsTaken: number;
  applicationDeadline: string | null;
  releaseDate: string | null;
  platforms: string; // JSON string[]; parse with parseStringArray
  placementType: string | null;
  priceNote: string | null;
  // Preformatted placement price — null means "no price set", i.e. render
  // the "on request" label. priceNote is a separate optional caption.
  priceDisplay: string | null;
}

export interface ProjectDetailDTO extends ProjectListDTO {
  gallery: string;
  status: string;
  releaseLabel: string;
  cpmDisplay: string; // "" when both bounds are unset
  opportunities: OpportunityDTO[];
  exposureTotal: number;
  actors: ActorDTO[];
  // ── Press-kit fields (Aram) ──
  tagline: string; // "" when unset
  subgenre: string; // "" when unset
  references: string[]; // comparable titles, parsed from the comma list
  cinemas: string[]; // exhibition venues, parsed from the comma list
  tiers: TierDTO[]; // sponsorship packages (the productised offer)
}

export interface ActorDTO {
  id: number;
  name: string;
  role: string;
  kind: string; // "CAST" | "CREW"
  photo: string; // uploaded headshot path, "" when none
}

export interface TierDTO {
  id: number;
  name: string;
  priceDisplay: string; // preformatted in the visitor's currency
  benefits: string[]; // parsed from the JSON benefits column
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

export interface ApplicationDTO {
  id: number;
  name: string;
  email: string | null;
  company: string | null;
  projectId: number | null;
  projectTitle: string | null;
  budget: string | null;
  message: string | null;
  status: string;
  note: string | null;
  createdAt: string;
}
