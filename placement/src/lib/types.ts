export type BrandSafetyLevel = "SAFE" | "REVIEW" | "RISK";

export interface SafetyCatDTO {
  name: string;
  score: number;
  aiText: string;
}

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
  safety: number;
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
  budgetRange: string;
  safety: BrandSafetyLevel;
  safetyScore: number;
  opportunitiesCount: number;
}

export interface ProjectDetailDTO extends ProjectListDTO {
  gallery: string;
  status: string;
  releaseLabel: string;
  cpmRange: string;
  safetyCats: SafetyCatDTO[];
  opportunities: OpportunityDTO[];
  exposureTotal: number;
  slotsTotal: number;
  slotsTaken: number;
  applicationDeadline: string | null;
  releaseDate: string | null;
  platforms: string; // JSON string[]; parse with parseStringArray
  placementType: string | null;
  priceNote: string | null;
  actors: ActorDTO[];
}

export interface ActorDTO {
  id: number;
  name: string;
  role: string;
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
