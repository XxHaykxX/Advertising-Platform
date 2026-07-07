/* Client-safe DTOs shared between the data layer (server) and components. */

export type ActorDTO = {
  firstName: string;
  lastName: string;
  role: string;
  photo?: string | null;
};

export type SceneDTO = {
  title: string;
  description: string;
  placement: string;
};

export type ProjectDTO = {
  id: number;
  title: string;
  poster: string | null;
  gallery: string[];
  genre: string;
  placement: string;
  slotsTotal: number;
  slotsAvailable: number;
  release: string; // display label, e.g. "Апрель 2026"
  platforms: string[];
  deadlineLabel: string; // e.g. "Заявки до 25 июня 2026"
  deadlineDate: string; // localized date only, e.g. "25 июня 2026"
  deadline: string; // ISO, for client-side filtering
  description: string;
  actors: ActorDTO[];
  scenes: SceneDTO[];
};

export type PortfolioMediaDTO =
  | { type: "image"; src: string }
  | { type: "youtube"; id: string; poster: string };

export type PortfolioDTO = {
  id: number;
  brand: string;
  film: string;
  description: string;
  cover: string;
  media: PortfolioMediaDTO[];
  publisherName: string | null;
};

export type PartnerDTO = {
  id: number;
  name: string;
  logo: string | null;
  url: string;
};

export type ContactsDTO = {
  phone: string;
  email: string;
  whatsapp: string;
  telegram: string;
  instagram: string;
  youtube: string;
};
