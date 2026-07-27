"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import type { ProjectKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireContentEditor, requireSuperadmin } from "@/lib/auth/require";
import { deleteUpload } from "@/lib/actions/uploads";
import { addStreamingSources } from "@/lib/actions/streaming-sources";
import { addCountries } from "@/lib/actions/countries";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import {
  PLACEMENT_TYPE_VALUES,
  KIND_VALUES,
  ROLE_VALUES,
  kindForRole,
  parseCsvInput,
  publishBlockers,
} from "./form-shared";

export type ProjectFormValues = {
  title: string;
  code: string;
  genre: string; // legacy single-genre display value; kept in sync with genres[0]
  genres: string[]; // multi-genre picks (Genre MultiSelect)
  synopsis: string;
  // ── Per-locale translations — the form only submits these; title/synopsis
  // above are derived from them (ru, then hy, then en) in buildData ──
  titleHy: string;
  titleRu: string;
  titleEn: string;
  synopsisHy: string;
  synopsisRu: string;
  synopsisEn: string;
  poster: string;
  gallery: string; // newline/comma-separated image URLs in the form; JSON string[] at rest
  // NB: the free-text `format` column is deliberately NOT part of the form
  // values (user request 2026-07-26 — "remove Format from admin"). It has had
  // no field since the redesign, so parsing it here meant every save wrote ""
  // over whatever the column held; leaving it out keeps the stored value (and
  // the catalog's Format chip) intact. Duration/episodes below are the admin's
  // only format inputs now.
  formatCategory: string; // marketing format bucket (FEATURE|SERIES|…); "" when unset
  language: string; // primary language (Armenian|Russian|…); "" when unset
  studio: string;
  // ── Film/Serial (#19) ──
  kind: ProjectKind;
  episodes: number | null; // SERIAL only
  episodeMinutes: number | null; // SERIAL only
  durationMinutes: number | null; // FILM only — total runtime, minutes
  // NB: `status` (Production stage) is NOT a form value — the field was removed
  // from both editors on 2026-07-26 at the owner's request. The column stays
  // (public catalog filter + report page), so parsing it here would write the
  // enum fallback over the stored value on every save.
  countries: string;
  ageRating: string; // content rating badge ("16+", "18+"); "" when unset
  boxOfficeAmd: number | null; // box-office gross, informational, optional
  productionBudgetAmd: number | null; // production budget — the CSV schema's "Budget" (owner decision C.3)
  isActive: boolean;
  // NB: `sortOrder` is deliberately NOT part of the form values (audit 1.2).
  // The form has no field for it, so parsing it here meant every save wrote 0
  // over the catalog position a superadmin had set by drag-and-drop —
  // reordering silently collapsed whenever anyone fixed a typo. Ordering is
  // owned solely by reorderProjects() further down.
  // ── Placement parity fields ──
  applicationDeadline: string; // <input type=date> value, "" when unset
  releaseDate: string; // <input type=date> value, "" when unset
  expectedReleaseDate: string; // <input type=date> value, "" when unset
  platforms: string; // comma-separated in the form; JSON string[] at rest — also the "Available on" field (#29, merged with the old Streaming source)
  // NB: `streamingSource` is gone from the form values too (audit 1.6). #29
  // merged that field into `platforms`; the column stays for the historical
  // data it still holds, but every save used to force it to null, which is
  // just a slow wipe. Nothing writes it now.
  placementType: string; // "" | one of PLACEMENT_TYPE_VALUES
  // ── Press-kit fields (Aram, 2026-07-09) ──
  tagline: string; // one-line logline (hero) — base/fallback, derived from the per-locale fields
  taglineHy: string; // per-locale logline (mirrors synopsisHy/Ru/En)
  taglineRu: string;
  taglineEn: string;
  references: string; // comparable titles, comma-separated ("Bohemian Rhapsody, Ray")
  cinemas: string; // exhibition venues, comma-separated ("Cinema Star, Kino Park")
  // ── Video (#10) — shown on the detail/report page ──
  videoEmbedUrl: string; // YouTube/Vimeo URL; "" when unset
  videoFile: string; // uploaded MP4 path ("/uploads/…"); "" when unset
};

export type ProjectFormState = {
  error?: string;
  values?: ProjectFormValues;
  // On success the action returns { ok: true, redirect } instead of calling
  // redirect() itself (see revalidateProjectPaths for why) — the client form
  // navigates on this signal (2026-07-15 bugfix).
  ok?: boolean;
  redirect?: string;
};

// MySQL caps a plain (non-@db.Text) Prisma String column at VarChar(191);
// anything longer throws an unhandled P2000 ("value too long"). Truncate at
// the form-parsing boundary so a save always succeeds instead of 500ing.
const VARCHAR_MAX = 191;

function str(fd: FormData, key: string, maxLen?: number) {
  const v = String(fd.get(key) || "").trim();
  return maxLen ? v.slice(0, maxLen) : v;
}
function int(fd: FormData, key: string, fallback = 0) {
  const n = parseInt(String(fd.get(key) || ""), 10);
  return Number.isFinite(n) ? n : fallback;
}
/** Blank input -> null instead of 0, for the optional AMD money fields. */
function intOrNull(fd: FormData, key: string): number | null {
  const raw = String(fd.get(key) || "").trim();
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}
function bool(fd: FormData, key: string) {
  return fd.get(key) === "on";
}
function enumVal<T extends string>(fd: FormData, key: string, allowed: readonly T[], fallback: T): T {
  const v = String(fd.get(key) || "");
  return (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}
function jsonArray<T>(fd: FormData, key: string): T[] {
  try {
    const a = JSON.parse(String(fd.get(key) || "[]"));
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

// ── Slots/deadline/platforms form <-> DB conversions ──────────────────────
// The form works with plain strings (date-input values, comma-separated
// platform lists); the DB stores DateTime? / JSON-string columns. Converting
// at this boundary keeps ProjectFormValues serializable and round-trippable
// through useActionState's echoed `values` on a failed submit.

/** "YYYY-MM-DD" (or "") -> Date | null for a Prisma DateTime? column. */
function dateOrNull(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "YouTube, Kinodaran, TV" -> JSON string[] (or null when empty) for the
   nullable @db.Text Json column. */
function platformsToJson(csv: string): string | null {
  const arr = csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? JSON.stringify(arr) : null;
}

/** "url1\nurl2" or "url1, url2" -> JSON string[] (or null when empty) for the
   nullable @db.Text gallery column. Splits on newlines and commas. */
function galleryToJson(input: string): string | null {
  const arr = input
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? JSON.stringify(arr) : null;
}

function buildData(fd: FormData): ProjectFormValues {
  // Genre/Countries/Platforms/Cinemas now ride in as JSON string[] (the
  // MultiSelect's hidden input) — parse once and re-derive the legacy
  // CSV/single-string columns the rest of the app still reads.
  const genres = jsonArray<string>(fd, "genres");
  const kind = enumVal(fd, "kind", KIND_VALUES, "FILM");
  // The form no longer submits generic title/synopsis fields — only the
  // per-locale ones. Derive the legacy title/synopsis columns from them
  // (ru first, per spec default, then hy, then en).
  const titleHy = str(fd, "titleHy", VARCHAR_MAX);
  const titleRu = str(fd, "titleRu", VARCHAR_MAX);
  const titleEn = str(fd, "titleEn", VARCHAR_MAX);
  const synopsisHy = str(fd, "synopsisHy");
  const synopsisRu = str(fd, "synopsisRu");
  const synopsisEn = str(fd, "synopsisEn");
  const taglineHy = str(fd, "taglineHy", VARCHAR_MAX);
  const taglineRu = str(fd, "taglineRu", VARCHAR_MAX);
  const taglineEn = str(fd, "taglineEn", VARCHAR_MAX);
  return {
    title: (titleRu || titleHy || titleEn).slice(0, VARCHAR_MAX),
    code: str(fd, "code", VARCHAR_MAX),
    genre: (genres[0] || "").slice(0, VARCHAR_MAX),
    genres,
    synopsis: synopsisRu || synopsisHy || synopsisEn,
    titleHy,
    titleRu,
    titleEn,
    synopsisHy,
    synopsisRu,
    synopsisEn,
    poster: str(fd, "poster", VARCHAR_MAX),
    gallery: str(fd, "gallery"),
    formatCategory: str(fd, "formatCategory", VARCHAR_MAX),
    // Language is now a MultiSelect (admin redesign phase 1) — same CSV
    // storage convention as genres/countries/platforms/cinemas.
    language: jsonArray<string>(fd, "language").join(", ").slice(0, VARCHAR_MAX),
    studio: str(fd, "studio", VARCHAR_MAX),
    kind,
    episodes: kind === "SERIAL" ? intOrNull(fd, "episodes") : null,
    episodeMinutes: kind === "SERIAL" ? intOrNull(fd, "episodeMinutes") : null,
    durationMinutes: kind === "FILM" ? intOrNull(fd, "durationMinutes") : null,
    countries: jsonArray<string>(fd, "countries").join(", ").slice(0, VARCHAR_MAX),
    ageRating: str(fd, "ageRating", VARCHAR_MAX),
    boxOfficeAmd: intOrNull(fd, "boxOfficeAmd"),
    productionBudgetAmd: intOrNull(fd, "productionBudgetAmd"),
    isActive: bool(fd, "isActive"),
    applicationDeadline: str(fd, "applicationDeadline"),
    releaseDate: str(fd, "releaseDate"),
    expectedReleaseDate: str(fd, "expectedReleaseDate"),
    platforms: jsonArray<string>(fd, "platforms").join(", ").slice(0, VARCHAR_MAX),
    placementType: enumVal(fd, "placementType", [...PLACEMENT_TYPE_VALUES, ""] as const, ""),
    tagline: taglineRu || taglineHy || taglineEn, // base/fallback, mirrors synopsis
    taglineHy,
    taglineRu,
    taglineEn,
    references: str(fd, "references"),
    cinemas: jsonArray<string>(fd, "cinemas").join(", "),
    videoEmbedUrl: str(fd, "videoEmbedUrl", VARCHAR_MAX),
    videoFile: str(fd, "videoFile", VARCHAR_MAX),
  };
}

/** Save-time validation: the bare minimum a row needs to exist at all.
   Everything the CSV schema marks required is checked separately, at publish
   time — see publishGate() below and the owner's 2026-07-26 decision. */
function validate(data: ProjectFormValues): string | null {
  if (!data.title) return "Enter a title in at least one language.";
  if (data.genres.length === 0) return "Genre is required.";
  if (!data.synopsis) return "Enter a synopsis in at least one language.";
  return null;
}

/** Publish-time validation. Fires only on the transition INTO publication —
   creating an active project, or flipping an inactive one live. An incomplete
   project still saves fine as an inactive draft, which is what the owner asked
   for.

   `wasActive` is why an already-live project is exempt: most rows in the
   catalog predate these requirements, and blocking their save would mean a
   publisher couldn't fix a typo without first filling four unrelated fields —
   exactly the trap the (now reverted) save-blocking Duration field created on
   2026-07-26. Creator-submitted content is still gated, at the moderation step
   (approveProject). Returns a ready localized message, or null. */
async function publishGate(
  data: ProjectFormValues,
  tierRows: { name: string; benefits: string }[],
  wasActive = false,
): Promise<string | null> {
  if (!data.isActive || wasActive) return null;
  const missing = publishBlockers({
    studio: data.studio,
    releaseDate: data.releaseDate,
    expectedReleaseDate: data.expectedReleaseDate,
    tagline: data.tagline,
    kind: data.kind,
    episodes: data.episodes,
    episodeMinutes: data.episodeMinutes,
    durationMinutes: data.durationMinutes,
    tiers: tierRows,
  });
  if (missing.length === 0) return null;
  const t = makeUI(await getLocale());
  return `${t("publish.blocked")} ${missing.map((key) => t(key)).join(", ")}. ${t("publish.blockedHint")}`;
}

// ── Inline cast/crew + sponsorship tiers (#20²) ───────────────────────────
// Both used to be standalone sub-editor forms (saveActors/saveTiers) that only
// worked in edit mode. They now ride in the main project form as hidden
// `actorsRows`/`tiersRows` JSON inputs and are persisted in the SAME
// transaction as the project — so a project + its cast + its tiers all save in
// one submit, on create and edit alike. Authz is the parent action's
// (requireContentEditor + ownership), so no separate re-check is needed.
const ACTOR_KIND_VALUES = ["CAST", "CREW"] as const;
type ActorInput = { name?: string; roles?: string[]; kind?: string; photo?: string; personId?: number | null };
type TierInput = {
  dbId?: number; // existing SponsorshipTier.id, absent for a newly added row
  name?: string;
  priceAmd?: number;
  benefits?: string;
  isExclusive?: boolean;
  availableSlots?: number | null;
  totalSlots?: number | null;
};
type MilestoneInput = { label?: string; date?: string; note?: string; active?: boolean };

/** "line 1\nline 2" -> JSON string[] (trimmed, blanks dropped) for the
   benefits @db.Text column. */
function benefitsToJson(input: string): string {
  const arr = (input || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return JSON.stringify(arr);
}

/** Rows for prisma.actor.createMany (projectId added by the caller, personId
   resolved separately by resolveActorPersonIds — see below). Blank-name rows
   are dropped; kind falls back to CAST; roles are filtered down to the fixed
   ROLE_VALUES list (defense in depth — the client MultiSelect is already
   strict); `role` (legacy single column) mirrors roles[0] so old readers of
   that column keep working. */
function parseActorRows(fd: FormData) {
  return jsonArray<ActorInput>(fd, "actorsRows")
    .filter((r) => (r.name || "").trim())
    .map((r, i) => {
      // Preserve every role the row carries. The strict dropdown is the input
      // gate for NEW picks; a hard ROLE_VALUES filter here would silently drop
      // legacy free-text roles (pre-Ф3, often hy/ru like "Ռեժիսոր") echoed as
      // chips — wiping existing cast roles on the first edit-save.
      const roles = (Array.isArray(r.roles) ? r.roles : []).filter(
        (v): v is string => typeof v === "string" && v.trim().length > 0,
      );
      return {
        name: (r.name || "").trim(),
        role: roles[0] ?? "",
        roles: JSON.stringify(roles),
        // CAST/CREW is derived from the picked role now (the dropdown is gone
        // from the editor). Only a role from the fixed list decides it; a legacy
        // free-text role (pre-Ф3, often hy/ru like "Ռեժիսոր") keeps the kind the
        // row already carries, so an edit-save can't flip an existing CREW
        // member to CAST just because their role predates ROLE_VALUES.
        kind: roles.length && (ROLE_VALUES as readonly string[]).includes(roles[0])
          ? kindForRole(roles[0])
          : (ACTOR_KIND_VALUES as readonly string[]).includes(r.kind ?? "")
            ? r.kind!
            : "CAST",
        photo: (r.photo || "").trim() || null,
        sortOrder: i,
        personId: typeof r.personId === "number" ? r.personId : null,
      };
    });
}

/** Resolve each actor row to a Person in the global directory — FIND-ONLY, it
   never creates a Person (user request 2026-07-25: a project must not spawn new
   people; cast can only be attached from the /admin/cast directory). Rows with
   a personId (picked from the dropdown) pass through; rows with only a typed
   name are matched to an existing Person by name (case-insensitive via the
   column collation), and if none exists the row is DROPPED — the person simply
   can't be attached until they're created in the directory first. */
type ResolvedActorRow = ReturnType<typeof parseActorRows>[number] & {
  personId: number;
  nameHy: string;
  nameRu: string;
  nameEn: string;
};

async function resolveActorPersonIds(
  tx: Prisma.TransactionClient,
  rows: ReturnType<typeof parseActorRows>,
): Promise<ResolvedActorRow[]> {
  const resolved: (ReturnType<typeof parseActorRows>[number] & { personId: number })[] = [];
  for (const r of rows) {
    if (r.personId != null) {
      resolved.push({ ...r, personId: r.personId });
      continue;
    }
    // Match on ANY spelling: the form sends the name in the language it was
    // showing, which is no longer necessarily the base column.
    const existing = await tx.person.findFirst({
      where: {
        OR: [{ name: r.name }, { nameHy: r.name }, { nameRu: r.name }, { nameEn: r.name }],
      },
    });
    if (existing) resolved.push({ ...r, personId: existing.id });
    // else: no directory match -> drop the row (no auto-create).
  }
  return snapshotPersonNames(tx, resolved);
}

/**
 * Overwrite each row's name columns with the directory's spelling of that
 * person (2026-07-27). The form only carries ONE name — whichever locale the
 * editor was showing — so trusting it would write an English spelling into the
 * base column the moment an admin saves a project. The Person row is the single
 * source of truth for how someone is spelled; the Actor row is its snapshot,
 * refreshed on every save. A person missing from the directory (shouldn't
 * happen — resolve is find-only) keeps whatever the form sent.
 */
async function snapshotPersonNames(
  tx: Prisma.TransactionClient,
  rows: (ReturnType<typeof parseActorRows>[number] & { personId: number })[],
): Promise<ResolvedActorRow[]> {
  if (rows.length === 0) return [];
  const persons = await tx.person.findMany({
    where: { id: { in: [...new Set(rows.map((r) => r.personId))] } },
    select: { id: true, name: true, nameHy: true, nameRu: true, nameEn: true },
  });
  const byId = new Map(persons.map((p) => [p.id, p]));
  return rows.map((r) => {
    const p = byId.get(r.personId);
    return {
      ...r,
      name: p?.name || r.name,
      nameHy: p?.nameHy ?? "",
      nameRu: p?.nameRu ?? "",
      nameEn: p?.nameEn ?? "",
    };
  });
}

/** Rows for prisma.sponsorshipTier (projectId added by the caller). `dbId`
   marks a row that already exists — see saveTierRows for why that matters. */
function parseTierRows(fd: FormData) {
  return jsonArray<TierInput>(fd, "tiersRows")
    .filter((r) => (r.name || "").trim())
    .map((r, i) => ({
      dbId: typeof r.dbId === "number" ? r.dbId : null,
      name: (r.name || "").trim().slice(0, VARCHAR_MAX),
      priceAmd: Math.max(0, Number(r.priceAmd) || 0),
      benefits: benefitsToJson(r.benefits || ""),
      isExclusive: !!r.isExclusive,
      availableSlots: r.availableSlots == null ? null : Math.max(0, Number(r.availableSlots) || 0),
      totalSlots: r.totalSlots == null ? null : Math.max(0, Number(r.totalSlots) || 0),
      sortOrder: i,
    }));
}

/** Persist the tier rows of one project inside an open transaction.

   Deliberately NOT the delete-all-then-insert shape the cast/milestone editors
   use. A SponsorshipTier is referenced by brand applications (Interest.tierId)
   and carries the slot bookkeeping a creator already committed to, so wiping
   and re-inserting silently detached every application from its package (they
   showed up as "no package specified") and reset reserved slots. Rows that
   came back with their id are updated in place, rows without one are created,
   and only tiers the editor actually removed get deleted. */
async function saveTierRows(
  tx: Prisma.TransactionClient,
  projectId: number,
  rows: ReturnType<typeof parseTierRows>,
) {
  const keptIds = rows.map((r) => r.dbId).filter((id): id is number => id != null);
  await tx.sponsorshipTier.deleteMany({
    where: { projectId, ...(keptIds.length ? { id: { notIn: keptIds } } : {}) },
  });
  for (const row of rows) {
    const { dbId, ...data } = row;
    if (dbId != null) {
      // Scoped by projectId as well as id: a crafted payload must not be able
      // to overwrite another project's package.
      await tx.sponsorshipTier.updateMany({ where: { id: dbId, projectId }, data });
    } else {
      await tx.sponsorshipTier.create({ data: { ...data, projectId } });
    }
  }
}

/** Rows for prisma.productionMilestone.createMany (projectId added by the
   caller). Blank-label rows are dropped; array order → sortOrder. `active` is
   single-select in the UI, but defend here too: keep only the FIRST active row
   marked (the report highlights exactly one current stage). */
function parseMilestoneRows(fd: FormData) {
  let activeSeen = false;
  return jsonArray<MilestoneInput>(fd, "milestonesRows")
    .filter((r) => (r.label || "").trim())
    .map((r, i) => {
      const active = !!r.active && !activeSeen;
      if (active) activeSeen = true;
      return {
        label: (r.label || "").trim().slice(0, VARCHAR_MAX),
        date: dateOrNull((r.date || "").trim()),
        note: (r.note || "").trim().slice(0, VARCHAR_MAX),
        isActive: active,
        sortOrder: i,
      };
    });
}

// ── Auto Code generation (#PP-YYYY-NNNN) ───────────────────────────────────
// Code is no longer a manual field on create: find the highest sequence
// number already used for the current year and take the next one, zero-padded
// to 4 digits. Uniqueness is still enforced by the DB's @unique constraint —
// createProject retries with a freshly generated code on a P2002 race.
function nextProjectCode(usedCodes: string[], year: number): string {
  const prefix = `#PP-${year}-`;
  let maxSeq = 0;
  for (const code of usedCodes) {
    const m = code.match(/^#PP-\d{4}-(\d+)$/);
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
  }
  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
}

async function generateProjectCode(): Promise<string> {
  const year = new Date().getFullYear();
  const rows = await prisma.project.findMany({
    where: { code: { startsWith: `#PP-${year}-` } },
    select: { code: true },
  });
  return nextProjectCode(rows.map((r) => r.code), year);
}

function revalidateProjectPaths(id?: number) {
  // Drop the cached DB reads in src/lib/data/projects.ts (tagged "projects") so
  // an admin edit is visible on next visit. `"max"` marks the tag stale
  // (stale-while-revalidate) — the Next 16 recommended two-arg form; the old
  // `{ expire: 0 }` blocking-expire form (plus revalidatePath("/") /
  // "/catalog") forced an immediate reseed from the root layout down, which
  // crashed the in-flight useActionState navigation with a black screen
  // ("This page couldn't load") — see 2026-07-15 bugfix. Public pages still
  // pick up the change via the tag within the visitor's next request.
  revalidateTag("projects", "max");
  revalidatePath("/admin/projects");
  if (id) revalidatePath(`/reports/${id}`);
}

export async function createProject(
  _prev: ProjectFormState,
  fd: FormData,
): Promise<ProjectFormState> {
  const user = await requireContentEditor();
  const data = buildData(fd);
  const error = validate(data);
  if (error) return { error, values: data };

  // Persist any custom Available-on values into the global Streaming Source
  // dictionary (Ф2/#25) so future projects offer them too — never blocks the
  // save. The dictionary used to seed from `streamingSource`; #29 merged that
  // field into `platforms`, so it's the source now.
  try {
    await addStreamingSources(parseCsvInput(data.platforms));
    // Same for the country dictionary: a country typed into this project is
    // offered on every future one (2026-07-27).
    await addCountries(parseCsvInput(data.countries));
  } catch {
    /* ignore */
  }

  // #17: Code is generated, not typed — the form no longer submits one on
  // create (data.code === ""). Retry a handful of times on a P2002 race
  // (two publishers saving in the same instant) by regenerating; a manually
  // supplied code (defensive — the field is readonly in the UI) is tried once.
  const autoCode = !data.code;
  const maxAttempts = autoCode ? 5 : 1;
  const actorRows = parseActorRows(fd);
  const tierRows = parseTierRows(fd);
  const milestoneRows = parseMilestoneRows(fd);

  const blocked = await publishGate(data, tierRows);
  if (blocked) return { error: blocked, values: data };

  // Project columns shared across code-retry attempts (code is added per-attempt).
  const projectData = {
    ...data,
    genres: data.genres.length ? JSON.stringify(data.genres) : null,
    synopsisHy: data.synopsisHy || null,
    synopsisRu: data.synopsisRu || null,
    synopsisEn: data.synopsisEn || null,
    poster: data.poster || null,
    gallery: galleryToJson(data.gallery),
    applicationDeadline: dateOrNull(data.applicationDeadline),
    releaseDate: dateOrNull(data.releaseDate),
    expectedReleaseDate: dateOrNull(data.expectedReleaseDate),
    platforms: platformsToJson(data.platforms),
    // #29 merged the old Streaming source field into `platforms`; the
    // `streamingSource` column is simply not written any more (audit 1.6 —
    // it used to be force-cleared on every save).
    placementType: data.placementType || null,
    tagline: data.tagline || null,
    taglineHy: data.taglineHy || null,
    taglineRu: data.taglineRu || null,
    taglineEn: data.taglineEn || null,
    references: data.references || null,
    cinemas: data.cinemas || null,
    videoEmbedUrl: data.videoEmbedUrl || null,
    videoFile: data.videoFile || null,
    // ownerId is always the creating user — never trusted from the form.
    ownerId: user.id,
    // #13: staff (SUPERADMIN/PUBLISHER) content is trusted and goes
    // straight to the public catalog — no moderation queue. This is
    // also the schema default, but set explicitly here so intent is
    // unambiguous if the Creator submission flow (#16) ever reuses
    // this action instead of its own. Creator-submitted projects must
    // start PENDING, not APPROVED.
    moderationStatus: "APPROVED" as const,
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const code = autoCode ? await generateProjectCode() : data.code;
    try {
      // #20²: project + its cast/crew + its tiers all commit together. A P2002
      // on the (unique) code rolls the whole tx back and we regenerate + retry.
      await prisma.$transaction(async (tx) => {
        const created = await tx.project.create({ data: { ...projectData, code } });
        if (actorRows.length) {
          const resolvedActors = await resolveActorPersonIds(tx, actorRows);
          await tx.actor.createMany({
            data: resolvedActors.map((r) => ({ ...r, projectId: created.id })),
          });
        }
        if (tierRows.length) {
          // dbId is a form-only marker (see saveTierRows) — never a column.
          await tx.sponsorshipTier.createMany({
            data: tierRows.map(({ dbId: _dbId, ...r }) => ({ ...r, projectId: created.id })),
          });
        }
        if (milestoneRows.length) {
          await tx.productionMilestone.createMany({
            data: milestoneRows.map((r) => ({ ...r, projectId: created.id })),
          });
        }
      }, { timeout: 15000 });
      revalidateProjectPaths();
      return { ok: true, redirect: "/admin/projects" };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        if (autoCode && attempt < maxAttempts) continue; // regenerate + retry
        return { error: `Code "${code}" is already in use.`, values: data };
      }
      throw e;
    }
  }
  return { error: "Could not generate a unique project code — please retry.", values: data };
}

export async function updateProject(
  id: number,
  _prev: ProjectFormState,
  fd: FormData,
): Promise<ProjectFormState> {
  const user = await requireContentEditor();
  const isSuperadmin = user.role === "SUPERADMIN";

  const existing = await prisma.project.findUnique({
    where: { id },
    // isActive feeds publishGate below: an already-live project isn't
    // re-validated, only one being taken live.
    select: { ownerId: true, isActive: true },
  });
  // 404 for both "doesn't exist" and "not yours" — a Publisher must not be
  // able to distinguish the two.
  if (!existing) notFound();
  if (!isSuperadmin && existing.ownerId !== user.id) notFound();

  const data = buildData(fd);
  const error = validate(data);
  if (error) return { error, values: data };

  // Persist any custom Available-on values into the global Streaming Source
  // dictionary (Ф2/#25) so future projects offer them too — never blocks the
  // save. The dictionary used to seed from `streamingSource`; #29 merged that
  // field into `platforms`, so it's the source now.
  try {
    await addStreamingSources(parseCsvInput(data.platforms));
    // Same for the country dictionary: a country typed into this project is
    // offered on every future one (2026-07-27).
    await addCountries(parseCsvInput(data.countries));
  } catch {
    /* ignore */
  }

  const actorRows = parseActorRows(fd);
  const tierRows = parseTierRows(fd);
  const milestoneRows = parseMilestoneRows(fd);

  const blocked = await publishGate(data, tierRows, existing.isActive);
  if (blocked) return { error: blocked, values: data };

  try {
    // #20²: update the project and fully replace its cast/crew + tiers in one
    // transaction (delete-all then re-insert mirrors the old saveActors/saveTiers
    // semantics, now folded into the single main-form submit). Interactive
    // (async callback) form rather than the plain array-of-ops batch, since
    // resolveActorPersonIds (Ф3) needs to create Persons and read their ids
    // back before the actor createMany below can run.
    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: {
          ...data,
          genres: data.genres.length ? JSON.stringify(data.genres) : null,
          synopsisHy: data.synopsisHy || null,
          synopsisRu: data.synopsisRu || null,
          synopsisEn: data.synopsisEn || null,
          poster: data.poster || null,
          gallery: galleryToJson(data.gallery),
          applicationDeadline: dateOrNull(data.applicationDeadline),
          releaseDate: dateOrNull(data.releaseDate),
          expectedReleaseDate: dateOrNull(data.expectedReleaseDate),
          platforms: platformsToJson(data.platforms),
          // #29 merged the old Streaming source field into `platforms`; the
          // `streamingSource` column is not written any more (audit 1.6).
          placementType: data.placementType || null,
          tagline: data.tagline || null,
          taglineHy: data.taglineHy || null,
          taglineRu: data.taglineRu || null,
          taglineEn: data.taglineEn || null,
          references: data.references || null,
          cinemas: data.cinemas || null,
          videoEmbedUrl: data.videoEmbedUrl || null,
          videoFile: data.videoFile || null,
        },
      });
      await tx.actor.deleteMany({ where: { projectId: id } });
      if (actorRows.length) {
        const resolvedActors = await resolveActorPersonIds(tx, actorRows);
        await tx.actor.createMany({ data: resolvedActors.map((r) => ({ ...r, projectId: id })) });
      }
      await saveTierRows(tx, id, tierRows);
      await tx.productionMilestone.deleteMany({ where: { projectId: id } });
      if (milestoneRows.length) {
        await tx.productionMilestone.createMany({ data: milestoneRows.map((r) => ({ ...r, projectId: id })) });
      }
    }, { timeout: 15000 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: `Code "${data.code}" is already in use.`, values: data };
    }
    throw e;
  }

  revalidateProjectPaths(id);
  return { ok: true, redirect: "/admin/projects" };
}

export async function deleteProject(id: number) {
  const user = await requireContentEditor();
  const existing = await prisma.project.findUnique({
    where: { id },
    // Pull every image the project owns so we can wipe the files too, not just
    // the DB rows — otherwise poster/gallery/cast photos are orphaned on disk.
    select: {
      ownerId: true,
      poster: true,
      gallery: true,
      actors: { select: { photo: true } },
    },
  });
  if (!existing) return;
  if (user.role !== "SUPERADMIN" && existing.ownerId !== user.id) return;

  // Collect the project's own image paths BEFORE deleting, then delete the row
  // (cascades to actors/tiers/interests/favorites via the schema), then remove
  // the files. deleteUpload skips any file still referenced elsewhere (another
  // project's gallery, a portfolio, an avatar), so shared images survive.
  const imagePaths = collectProjectImagePaths(existing);

  await prisma.project.delete({ where: { id } });

  for (const p of imagePaths) {
    try {
      await deleteUpload(p);
    } catch {
      // best-effort file cleanup — never let a stray unlink error block delete
    }
  }

  revalidateProjectPaths(id);
}

/** Every /uploads/… image a project owns: poster, gallery entries and cast/crew
 *  photos. External URLs (not /uploads/…) are left untouched. */
function collectProjectImagePaths(p: {
  poster: string | null;
  gallery: string | null;
  actors: { photo: string | null }[];
}): string[] {
  const out: string[] = [];
  if (p.poster) out.push(p.poster);
  if (p.gallery) {
    try {
      const arr = JSON.parse(p.gallery);
      if (Array.isArray(arr)) out.push(...arr.filter((x): x is string => typeof x === "string"));
    } catch {
      // malformed gallery JSON — nothing to clean up
    }
  }
  for (const a of p.actors) if (a.photo) out.push(a.photo);
  return [...new Set(out)].filter((x) => x.startsWith("/uploads/"));
}

export async function toggleActive(id: number, isActive: boolean) {
  const user = await requireContentEditor();
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!existing) return;
  if (user.role !== "SUPERADMIN" && existing.ownerId !== user.id) return;

  await prisma.project.update({ where: { id }, data: { isActive } });
  revalidateProjectPaths(id);
}

// ── Drag-and-drop catalog ordering (T2) ────────────────────────────────────
// sortOrder drives /catalog (src/lib/data/projects.ts orderBy sortOrder asc).
// The admin list is a single global sequence across every project regardless
// of owner, so this only makes sense from the SUPERADMIN's full-list view — a
// Publisher only ever sees their own subset (page.tsx's ownerId scoping), and
// reassigning sortOrder=index within that subset would scramble everyone
// else's position in the public catalog. Gated with requireSuperadmin() (not
// requireContentEditor, which a Publisher also passes) for that reason.
export async function reorderProjects(orderedIds: number[]) {
  await requireSuperadmin();
  if (orderedIds.length === 0) return;

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.project.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
  revalidateProjectPaths();
}

// ── Duplicate a project as a template (#20²) ───────────────────────────────
// Clones every scalar column plus cast/crew + tiers into a brand-new project
// owned by the current user, with a freshly generated code, an inactive
// ("(copy)") draft state so it can't accidentally hit the public catalog, and
// a re-run of the auto-code retry loop. Returns { redirect } for the client to
// navigate (same safe pattern as create/update — never redirect() inside a
// transition, per the 2026-07-15 black-screen bugfix).
export async function duplicateProject(
  id: number,
): Promise<{ ok?: boolean; redirect?: string; error?: string }> {
  const user = await requireContentEditor();
  const src = await prisma.project.findUnique({
    where: { id },
    include: {
      actors: { orderBy: { sortOrder: "asc" } },
      tiers: { orderBy: { sortOrder: "asc" } },
      milestones: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!src) return { error: "Project not found." };
  // Ownership scoping mirrors updateProject: a Publisher can only clone their own.
  if (user.role !== "SUPERADMIN" && src.ownerId !== user.id) return { error: "Not authorized." };

  // Strip identity/relations/timestamps; keep every other scalar column verbatim.
  const {
    id: _id,
    code: _code,
    ownerId: _ownerId,
    createdAt: _createdAt,
    actors,
    tiers,
    milestones,
    ...scalars
  } = src;

  for (let attempt = 1; attempt <= 5; attempt++) {
    const code = await generateProjectCode();
    try {
      const created = await prisma.$transaction(async (tx) => {
        const proj = await tx.project.create({
          data: {
            ...scalars,
            title: `${src.title} (copy)`.slice(0, VARCHAR_MAX),
            code,
            isActive: false,
            moderationStatus: "APPROVED",
            ownerId: user.id,
          },
        });
        if (actors.length) {
          await tx.actor.createMany({
            data: actors.map((a, i) => ({
              projectId: proj.id,
              name: a.name,
              nameHy: a.nameHy,
              nameRu: a.nameRu,
              nameEn: a.nameEn,
              role: a.role,
              roles: a.roles,
              kind: a.kind,
              photo: a.photo,
              sortOrder: i,
              // Copied verbatim (not re-resolved) — the clone credits the
              // same real Person, same as picking them from the directory.
              personId: a.personId,
            })),
          });
        }
        if (tiers.length) {
          await tx.sponsorshipTier.createMany({
            data: tiers.map((tier, i) => ({
              projectId: proj.id,
              name: tier.name,
              priceAmd: tier.priceAmd,
              benefits: tier.benefits,
              isExclusive: tier.isExclusive,
              availableSlots: tier.availableSlots,
              totalSlots: tier.totalSlots,
              sortOrder: i,
            })),
          });
        }
        if (milestones.length) {
          await tx.productionMilestone.createMany({
            data: milestones.map((m, i) => ({
              projectId: proj.id,
              label: m.label,
              date: m.date,
              note: m.note,
              isActive: m.isActive,
              sortOrder: i,
            })),
          });
        }
        return proj;
      }, { timeout: 15000 });
      revalidateProjectPaths();
      return { ok: true, redirect: `/admin/projects/${created.id}/edit` };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && attempt < 5) {
        continue; // code race — regenerate + retry
      }
      throw e;
    }
  }
  return { error: "Could not generate a unique project code — please retry." };
}
