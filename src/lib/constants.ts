/* Client-safe constants (no DB / server imports). */

export const GENRES = ["Драма", "Боевик", "Комедия", "Фантастика", "Триллер"];

export const PLATFORMS = ["YouTube", "Kinodaran", "TV"];

export const PLATFORM_STYLE: Record<string, string> = {
  YouTube: "bg-red-600/15 text-red-400 border-red-500/30",
  Kinodaran: "bg-white/10 text-white/80 border-white/20",
  TV: "bg-sky-500/15 text-sky-300 border-sky-400/30",
};

/* Application lifecycle statuses */
export const APP_STATUSES = ["new", "in_progress", "closed"] as const;
export type AppStatus = (typeof APP_STATUSES)[number];

export const STATUS_LABEL: Record<AppStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  closed: "Закрыта",
};

export const STATUS_STYLE: Record<AppStatus, string> = {
  new: "border-primary/40 bg-primary/15 text-primary",
  in_progress: "border-amber-400/40 bg-amber-400/15 text-amber-300",
  closed: "border-white/15 bg-white/10 text-white/60",
};
