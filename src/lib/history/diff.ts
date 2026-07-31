import "server-only";

// Turns two snapshots into the one-line "what changed" a history row shows.
// Computed at write time: the history list renders hundreds of rows and must
// not diff two JSON blobs per row to do it.
//
// Labels are English, matching the rest of the admin panel.

const FIELD_LABELS: Record<string, string> = {
  titleHy: "title (hy)",
  titleRu: "title (ru)",
  titleEn: "title (en)",
  synopsisHy: "synopsis (hy)",
  synopsisRu: "synopsis (ru)",
  synopsisEn: "synopsis (en)",
  taglineHy: "logline (hy)",
  taglineRu: "logline (ru)",
  taglineEn: "logline (en)",
  poster: "poster",
  gallery: "gallery",
  genre: "genre",
  genres: "genres",
  formatCategory: "format",
  kind: "kind",
  episodes: "episodes",
  episodeMinutes: "minutes per episode",
  durationMinutes: "runtime",
  countries: "countries",
  studio: "studio",
  platforms: "available on",
  cinemas: "cinemas",
  references: "reference titles",
  ageRating: "age rating",
  language: "language",
  status: "production stage",
  moderationStatus: "moderation",
  rejectionReason: "rejection reason",
  isActive: "visibility",
  applicationDeadline: "application deadline",
  releaseDate: "release date",
  productionBudgetAmd: "budget",
  videoEmbedUrl: "video link",
  videoFile: "video file",
  ownerId: "owner",
  sortOrder: "order",
  // nested collections
  actors: "cast & crew",
  tiers: "tiers",
  placements: "placements",
  milestones: "timeline",
  // Person / Portfolio / Partner
  name: "name",
  nameHy: "name (hy)",
  nameRu: "name (ru)",
  nameEn: "name (en)",
  role: "role",
  photo: "photo",
  image: "image",
  logo: "logo",
  url: "link",
  title: "title",
};

function label(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

/** Compare two snapshots and describe the difference in one short line.
 *
 *  Nested collections are reported as a whole ("cast & crew (3 → 5)") rather
 *  than per row: the project form replaces them wholesale on every save, so
 *  row-level diffing would report churn that no human caused. */
export function summarize(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): string {
  if (!before) return "created";
  if (!after) return "deleted";

  const changed: string[] = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of keys) {
    const a = before[key];
    const b = after[key];

    if (Array.isArray(a) || Array.isArray(b)) {
      const aLen = Array.isArray(a) ? a.length : 0;
      const bLen = Array.isArray(b) ? b.length : 0;
      if (JSON.stringify(a ?? []) === JSON.stringify(b ?? [])) continue;
      changed.push(aLen === bLen ? label(key) : `${label(key)} (${aLen} → ${bLen})`);
      continue;
    }

    // Dates arrive as Date objects from Prisma but as strings from a parsed
    // snapshot — compare their serialized form so a round-trip is not a change.
    if (JSON.stringify(a ?? null) === JSON.stringify(b ?? null)) continue;
    changed.push(label(key));
  }

  if (!changed.length) return "no visible change";

  // Long lists get truncated: the line sits in a table cell, not a report.
  const shown = changed.slice(0, 6);
  const rest = changed.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} +${rest} more` : shown.join(", ");
}
