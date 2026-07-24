# ACTIVE TASK LIST — 2026-07-24 (batch session, survives compact)

Prod HEAD before this session's new work = `4a473a8` (T1 poster + T2 order deployed).
Work cadence: **batches of 5 tasks → STOP for user compact → resume**. Do NOT lose this list.
All decisions below are FINAL (chosen by user via multiple-choice). @dnd-kit installed (dependencies).

## Global rules
- **NO DEPLOY until ALL tasks done AND user verifies locally (dev:3001).** (user order 2026-07-24). Per batch: finish code + `npx tsc --noEmit` + `npx vitest run` + review diffs, then STOP for user local check + compact. Deploy only at the very end.
- **NO QA until the REDESIGN is fully done** (user order 2026-07-24). A `/goal` Stop-hook wants QA of all 16 tasks, but user said finish redesign first, THEN QA. So: finish redesign → QA all → (later) deploy.
- @dnd-kit is standard for ALL drag-drop (smooth full-row). Prod migration `docs/prod-migrations/2026-07-24-video-person.sql` (Person table + Project.videoEmbedUrl/videoFile) must run on prod BEFORE the eventual push. Local dev DB already migrated (prisma db push done).
- Creator form (/account/projects) = SAME ProjectForm component → redesign applies there too (user: unified view).
- Migrations (#9/#10/#11): ONE combined prod migration, applied to prod BEFORE push (memory rule prod-deploy-migration).
- @dnd-kit is the standard for ALL drag-drop (smooth full-row drag) — user disliked native HTML5 "dragging text" look.
- Cyrillic-homoglyph-free Armenian. Reply Russian. Caveman mode.

## The 15 tasks + decisions

| # | Task | FINAL decision | Migration | Files |
|---|------|----------------|:---:|-------|
| 1 | Projects drag-drop order | REDO with @dnd-kit, smooth full-row drag (replace agent's native HTML5) | no | src/app/admin/(panel)/projects/reorder-list.tsx |
| 2 | Hide project `code` | Remove EVERYWHERE incl admin: project-card:89, report-hero:48+67, brand browse-view/favorites/interests, admin projects list (page.tsx + reorder-list.tsx) | no | multiple |
| 3 | Project images drag-drop | @dnd-kit smooth reorder of gallery images | no | image uploader component |
| 4 | Remove synopsis from card | ONLY public catalog card (project-card.tsx:90) | no | src/components/project-card.tsx |
| 5 | translate bug | Deleting one locale's synopsis + pressing Translate wipes ALL content — FIX | no | translate-action.ts / project-form.tsx / lib/translate.ts |
| 6 | Wider admin | Whole admin working area full-width (remove max-width) | no | src/app/admin/(panel)/layout.tsx or admin-shell.tsx |
| 7 | Images 16:9 | Change 16:10 → 16:9 EVERYWHERE | no | image blocks site-wide + upload processing |
| 8 | Add cast member → first | New empty row PREPENDED (top), not appended | no | actors-editor.tsx:68 |
| 9 | Cast&Crew section | GLOBAL person CRUD manager: new left-nav item + page (add/edit/delete people: photo/name/role), reusable across projects; inline editor stays; reorder via @dnd-kit | YES | new admin page + schema (People/Actor) + admin-nav.tsx |
| 10 | Video on detail | BOTH embed link (YouTube/Vimeo) + MP4 upload | YES | Project schema (video fields) + detail/report + form |
| 11 | About block | Rename admin "Translations" block → "About". Full ref structure: Title + light-rich (markdown/basic, NOT full HTML) Description + Short description (140 char). 3-lang TABS (hy/ru/en) + Translate button. Public: Description → detail/report page (near video); Short description → cards/limited-space. | YES | project-form.tsx + schema (description/shortDescription per-locale) + detail |
| 12 | genre after kind | Move genre field to AFTER kind in admin form | no | project-form.tsx |
| 13 | Image-select button → Media browser | Poster-gen (and other places) image-pick button must open MediaPicker (server library), not only OS file dialog; fix everywhere MediaPicker fails to open | no | poster-generator.tsx + MediaPicker usages |
| 14 | Admin UX redesign | Make admin "super-like" & visually beautiful, denser (Cast&Crew currently wastes space). Research reference platforms, propose, get user approval BEFORE rebuild. Don't break. | ? | admin-wide (proposal first) |
| 15 | Bulk media upload | Drag-drop multi-file mass upload into Media from computer (currently impossible) | no | media upload component |

Ref image for #11 (About block): C:\Users\Admin\Pictures\Screenshots\Screenshot 2026-07-24 145956.png — About / Title / Description(rich toolbar+HTML) / Short description (140 chars left).

## Batch plan
- **Batch 1 (tasks #1, #2, #4, #6, #12)** — safe, no migration, partitioned by file. IN PROGRESS.
  - A1 (dnd): #1 reorder-list.tsx @dnd-kit + remove code from admin projects list (#2 admin part) — owns page.tsx + reorder-list.tsx
  - A2 (public-hide): #2 code in public/brand + #4 synopsis card — owns project-card, report-hero, browse-view, favorites, interests
  - A3 (form): #12 genre after kind — owns project-form.tsx
  - A4 (wider): #6 admin full-width — owns layout.tsx/admin-shell.tsx
  - A5 (design-research, Fable5, NO code): #14 admin redesign proposal + references → present to user
- **Batch 2 (#5, #8, #13, #15, #7)** — mostly safe/no-migration.
- **Batch 3 (#9, #10, #11)** — need combined prod migration; #11 uses About ref image; build after design proposal approved.
- **#3** images dnd — after A1 establishes @dnd-kit pattern.

## STATUS (2026-07-24, before compact #2)

### Original 16 tasks — ALL CODE DONE (green: tsc 0, vitest 62/62, prod build ok via `npx next build`)
#1 dnd projects ✅ · #2 hide code ✅ · #3 gallery img reorder ✅ · #4 synopsis off card ✅ · #5 translate wipe fix ✅ · #6 wider admin ✅(partial, finalize in redesign) · #7 16:9 everywhere ✅ · #8 cast prepend ✅ · #9 cast global manager /admin/cast ✅ · #10 video ✅ (embed + MP4/webm upload both work; m1-mp4 added accept prop, project-form videoFile has accept="video") · #11 About tabs ✅ · #12 genre after kind ✅ · #13 media picker opens library ✅ · #14 admin redesign → see below · #15 media bulk drag-drop ✅ · #16 MediaPicker Download btn ✅
NOT committed, NOT deployed.

### In-flight agents (running through compact, results arrive as teammate msgs)
- **m1-mp4**: fix MP4 upload — add `accept` video prop to MediaField/MediaPicker + video branch in upload action (mp4/webm, size cap ~50MB). Will report the exact prop project-form's videoFile field must pass (then wire it into project-form.tsx).
- **r-cast**: Cast + Tiers → compact 48px table editors (proposal §3.1), avatar chip→MediaPicker, @dnd-kit reorder, borderless inputs. Owns actors-editor.tsx + tiers-editor.tsx only.

### REDESIGN (#14) — decisions FINAL, tasks below
Proposal doc: `docs/superpowers/specs/2026-07-24-admin-redesign-proposal.md`. User decided: do the main pass now, 2-column form LATER (don't forget), creator form unified, collapsed sidebar YES. (User didn't like P1/P2/P3 jargon — just build.)
Redesign task breakdown (file-partitioned to avoid agent collisions):
- **R-cast** (RUNNING): Cast+Tiers table editors — actors-editor.tsx, tiers-editor.tsx
- **R-form** (TODO): sticky Save bar (dirty dot) + density pass on form sections/inputs — project-form.tsx. MUST preserve About tabs (g1), hidden-input mirrors (actorsRows/tiersRows/poster/gallery/videoFile), draft autosave (DRAFT_KEY/CONTROLLED_NAMES). Also wire videoFile MediaField `accept` prop once m1-mp4 reports it.
- **R-nav** (TODO): grouped nav (CONTENT/PLATFORM/COMMS) + collapsed sidebar toggle (w-60↔w-14, localStorage) + finalize wider shell padding — admin-nav.tsx, admin-shell.tsx
- **R-list** (TODO): projects list filter row (title search + status/active) + colored status pills + row density; apply to BOTH dnd table (reorder-list.tsx) and Publisher plain table (page.tsx)
- **R-media** (TODO): filename search box in media library — media-manager.tsx (bulk dropzone already done in #15)
- **R-2col** (LATER, queued): two-column form (main + meta sidebar) + section rail + scroll-spy — project-form.tsx. Riskiest; do after the above, get user eyes.
Don't-break list (proposal §4): single `<form>` element wraps everything; keep field `name`s; controlled widgets keep hidden mirrors; inactive translation tabs stay MOUNTED (hidden class); server actions untouched; admin chrome English / creator locale-aware.

### After redesign: QA all 16 (goal hook), then user local check, then prod migration + deploy.

## Status log
- Batch 1 (#1,#2,#4,#6,#12) done. Batch 2/3 (#3,#5,#7,#8,#9,#10,#11,#13,#15,#16) done. Redesign #14 started (r-cast running). MP4 fix running (m1-mp4).
