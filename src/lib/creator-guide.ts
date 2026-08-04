// Content manifest for /for-creators — the single source of truth for which
// fields the guide explains, what requirement tier each one carries, and
// which i18n keys hold its copy. Pure module (no React, no Prisma, no
// "server-only"): safe to import from the server page and from the guard
// test alike.
//
// Deliberately does NOT import BLOCKS_PUBLISH from project-completeness.ts —
// that set is owned by another change landing in parallel. Each field's
// `tier` below is a literal instead, and creator-guide.guard.test.ts asserts
// it agrees with the real BLOCKS_PUBLISH so the two can't silently drift.
import type { CompletenessKey } from "@/lib/project-completeness";

/** The three requirement tiers (owner decision, see the approved plan):
 *  - "required" — actions.ts validate() (~line 167-170): blocks SAVE.
 *  - "publish" — project-completeness.ts BLOCKS_PUBLISH: the project saves
 *    fine, it just can't reach moderation / the catalog while this is empty.
 *  - "optional" — everything else. An empty section on the report page just
 *    doesn't render (completeness.hint) — the brand never learns it exists. */
export type GuideTier = "required" | "publish" | "optional";

export interface GuideField {
  /** Bare id — also the DOM anchor (`#f-<id>`) a support link can point at. */
  id: string;
  /** An i18n key reused as the field's label wherever the project form
   *  already has one (plan: "не дублируем подписи полей"). Only two fields
   *  cover more ground than a single form label (video's two input modes,
   *  runtime's film/series split), so those two get their own
   *  forCreators.field.*.label key instead. */
  labelKey: string;
  descKey: string;
  exampleKey?: string;
  tier: GuideTier;
  /** The matching CompletenessKey (project-completeness.ts), when this field
   *  has a "what a brand sees" entry. Cross-checked by the guard test. */
  completenessKey?: CompletenessKey;
}

export interface GuideStep {
  /** Section anchor: "step-1".."step-5". */
  id: string;
  titleKey: string;
  subtitleKey: string;
  fields: GuideField[];
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: "step-1",
    titleKey: "forCreators.step.texts.title",
    subtitleKey: "forCreators.step.texts.subtitle",
    fields: [
      {
        id: "title",
        labelKey: "projectForm.about.title",
        descKey: "forCreators.field.title.desc",
        exampleKey: "projectForm.about.titlePlaceholder",
        tier: "required",
      },
      {
        id: "synopsis",
        labelKey: "projectForm.about.description",
        descKey: "forCreators.field.synopsis.desc",
        tier: "required",
      },
      {
        id: "logline",
        labelKey: "projectForm.field.tagline",
        descKey: "forCreators.field.logline.desc",
        exampleKey: "projectForm.taglinePlaceholder",
        tier: "publish",
        completenessKey: "tagline",
      },
      {
        id: "genres",
        labelKey: "projectForm.field.genre",
        descKey: "forCreators.field.genres.desc",
        tier: "required",
      },
    ],
  },
  {
    id: "step-2",
    titleKey: "forCreators.step.pressKit.title",
    subtitleKey: "forCreators.step.pressKit.subtitle",
    fields: [
      {
        id: "poster",
        labelKey: "projectForm.media.posterHeading",
        descKey: "forCreators.field.poster.desc",
        tier: "publish",
        completenessKey: "poster",
      },
      {
        id: "gallery",
        labelKey: "projectForm.media.galleryHeading",
        descKey: "forCreators.field.gallery.desc",
        tier: "optional",
        completenessKey: "gallery",
      },
      {
        id: "video",
        labelKey: "forCreators.field.video.label",
        descKey: "forCreators.field.video.desc",
        exampleKey: "projectForm.videoEmbedPlaceholder",
        tier: "optional",
        completenessKey: "video",
      },
    ],
  },
  {
    id: "step-3",
    titleKey: "forCreators.step.cast.title",
    subtitleKey: "forCreators.step.cast.subtitle",
    fields: [
      {
        id: "castPhoto",
        labelKey: "projectForm.cast.photo",
        descKey: "forCreators.field.castPhoto.desc",
        tier: "optional",
        completenessKey: "castPhotos",
      },
      {
        // "cast" (CompletenessKey) is a per-project count, not a per-field
        // check — attached to the name row, the one that actually creates a
        // countable cast/crew member (ANCHORS in
        // project-completeness-checklist.tsx does the same: "cast" -> "sec-cast").
        id: "castName",
        labelKey: "projectForm.cast.name",
        descKey: "forCreators.field.castName.desc",
        tier: "optional",
        completenessKey: "cast",
      },
      {
        id: "castRoles",
        labelKey: "projectForm.cast.role",
        descKey: "forCreators.field.castRoles.desc",
        tier: "optional",
      },
    ],
  },
  {
    id: "step-4",
    titleKey: "forCreators.step.production.title",
    subtitleKey: "forCreators.step.production.subtitle",
    fields: [
      {
        id: "kind",
        labelKey: "projectForm.field.kind",
        descKey: "forCreators.field.kind.desc",
        tier: "optional",
      },
      {
        id: "runtime",
        labelKey: "forCreators.field.runtime.label",
        descKey: "forCreators.field.runtime.desc",
        tier: "publish",
        completenessKey: "runtime",
      },
      {
        id: "studio",
        labelKey: "projectForm.field.studio",
        descKey: "forCreators.field.studio.desc",
        exampleKey: "projectForm.studioPlaceholder",
        tier: "publish",
        completenessKey: "studio",
      },
      {
        id: "formatCategory",
        labelKey: "projectForm.field.formatCategory",
        descKey: "forCreators.field.formatCategory.desc",
        tier: "publish",
        completenessKey: "formatCategory",
      },
      {
        id: "countries",
        labelKey: "projectForm.field.countries",
        descKey: "forCreators.field.countries.desc",
        tier: "optional",
        completenessKey: "countries",
      },
      {
        id: "ageRating",
        labelKey: "projectForm.field.ageRating",
        descKey: "forCreators.field.ageRating.desc",
        tier: "optional",
        completenessKey: "ageRating",
      },
      {
        id: "budget",
        labelKey: "projectForm.field.productionBudget",
        descKey: "forCreators.field.budget.desc",
        tier: "optional",
        completenessKey: "budget",
      },
      {
        id: "releaseDate",
        labelKey: "projectForm.field.releaseDate",
        descKey: "forCreators.field.releaseDate.desc",
        tier: "optional",
        completenessKey: "releaseDate",
      },
      {
        id: "deadline",
        labelKey: "projectForm.field.applicationDeadline",
        descKey: "forCreators.field.deadline.desc",
        tier: "publish",
        completenessKey: "deadline",
      },
      {
        id: "platforms",
        labelKey: "projectForm.field.availableOn",
        descKey: "forCreators.field.platforms.desc",
        exampleKey: "projectForm.availableOnPlaceholder",
        tier: "optional",
        completenessKey: "platforms",
      },
      {
        id: "cinemas",
        labelKey: "projectForm.field.cinemas",
        descKey: "forCreators.field.cinemas.desc",
        exampleKey: "projectForm.cinemasPlaceholder",
        tier: "optional",
        completenessKey: "cinemas",
      },
      {
        // Opened to creators on 2026-08-04 (owner decision). Until then the
        // Production Timeline section was hidden in creator mode, which is why
        // the original manifest left it out entirely.
        id: "milestones",
        labelKey: "projectForm.section.milestones",
        descKey: "forCreators.field.milestones.desc",
        exampleKey: "forCreators.field.milestones.example",
        tier: "optional",
        completenessKey: "milestones",
      },
    ],
  },
  {
    id: "step-5",
    titleKey: "forCreators.step.offer.title",
    subtitleKey: "forCreators.step.offer.subtitle",
    fields: [
      {
        id: "tiers",
        labelKey: "projectForm.section.sponsorshipTiers",
        descKey: "forCreators.field.tiers.desc",
        exampleKey: "projectForm.tiers.namePlaceholder",
        tier: "publish",
        completenessKey: "tiers",
      },
      {
        id: "placements",
        labelKey: "projectForm.section.placements",
        descKey: "forCreators.field.placements.desc",
        exampleKey: "projectForm.placements.titlePlaceholder",
        tier: "publish",
        completenessKey: "placements",
      },
      {
        id: "references",
        labelKey: "projectForm.section.references",
        descKey: "forCreators.field.references.desc",
        exampleKey: "projectForm.field.referenceNamePlaceholder",
        tier: "optional",
        completenessKey: "references",
      },
    ],
  },
];

/** Mirrors validate() in src/app/account/projects/actions.ts (~line 167-170)
 *  exactly: the three fields that block SAVE, not just publication. Can't
 *  import that list directly — actions.ts is a "use server" module, and any
 *  export from a "use server" file becomes a public RPC endpoint. Field ids
 *  match the step-1 rows above; the guard test checks the two stay in sync. */
export const REQUIRED_FIELD_IDS: readonly string[] = ["title", "synopsis", "genres"];

/** Legend copy for each tier badge. "optional" reuses the existing
 *  completeness.hint string instead of a new key — same mechanic, already
 *  translated three ways (plan: "Формулировку третьего уровня берём готовой"). */
export const GUIDE_TIERS: Record<GuideTier, { labelKey: string; descKey: string }> = {
  required: { labelKey: "forCreators.tier.required.label", descKey: "forCreators.tier.required.desc" },
  publish: { labelKey: "forCreators.tier.publish.label", descKey: "forCreators.tier.publish.desc" },
  optional: { labelKey: "forCreators.tier.optional.label", descKey: "completeness.hint" },
};

export interface FileRequirementRow {
  id: string;
  /** Reused field label — same field this row's limits describe. */
  typeLabelKey: string;
  /** Aspect ratio / pixel dimensions — identical across locales (numbers,
   *  not prose), so these stay plain strings instead of dictionary keys. */
  ratio: string;
  maxSize: string;
  formats: string;
  consequenceKey: string;
}

/** Limits pulled from media-field.tsx (MAX_MB) and the crop dialogs used in
 *  project-form.tsx (16:9 poster/gallery, 1:1 cast photo) — see that file's
 *  own comments for the source numbers. */
export const FILE_REQUIREMENTS: FileRequirementRow[] = [
  {
    id: "poster",
    typeLabelKey: "projectForm.media.posterHeading",
    ratio: "16:9 · 1600×900",
    maxSize: "8 MB",
    formats: "JPG, PNG, WebP, GIF, AVIF",
    consequenceKey: "forCreators.fileReq.poster.consequence",
  },
  {
    id: "gallery",
    typeLabelKey: "projectForm.media.galleryHeading",
    ratio: "16:9 · 1600×900",
    maxSize: "8 MB",
    formats: "JPG, PNG, WebP, GIF, AVIF",
    consequenceKey: "forCreators.fileReq.gallery.consequence",
  },
  {
    id: "castPhoto",
    typeLabelKey: "projectForm.cast.photo",
    ratio: "1:1 · 800×800",
    maxSize: "8 MB",
    formats: "JPG, PNG, WebP, GIF, AVIF",
    consequenceKey: "forCreators.fileReq.castPhoto.consequence",
  },
  {
    id: "videoFile",
    typeLabelKey: "projectForm.field.videoFile",
    ratio: "16:9",
    maxSize: "50 MB",
    formats: "MP4, WebM",
    consequenceKey: "forCreators.fileReq.videoFile.consequence",
  },
];
