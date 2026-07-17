# Session Progress — 2026-07-16 (part b)

Continuation session. Two phases: a prod deploy, then a batch of local dev-tested work.

## Phase 1 — DEPLOYED to prod (igovazd.am)

Prod HEAD = `c33e3e2`. Pushed + auto-built on Hostinger, live.

- **Whole fix.md batch #10–#26 + QA #36/#37** (members auth, project moderation, brand+creator cabinets, single-page project form, poster gen, translate, email, black-screen fix, etc.).
- **F14** — admin `/admin/interests` page (brand express-interest, `Interest` model, superadmin-only) + nav item.
- **F3** — role-aware register placeholders (brand vs creator/studio) + i18n keys.
- **#20²** — verified E2E (single-page form, autosave draft, Duplicate-as-template, auto-Code).
- **Prod DB migrated first** (remote `prisma db push`, 100% additive — Interest/PasswordResetToken tables, Project.moderationStatus/kind/episodes/genres, Role += MODERATOR/BRAND/CREATOR, User.avatar/website/etc.). No data loss.
- **Build fix** — `@types/nodemailer` + `@types/bcryptjs` moved devDependencies → dependencies (Hostinger prunes devDeps during the prod build; the TS type-check then failed). Commit `c33e3e2`.
- **Env** — hPanel vars are live (translate reaches Google → key is set). `.env.hostinger` generated at repo root (gitignored) with the full var set; `ADMIN_EMAIL=admin@igovazd.am`.
- **Prod test accounts** (registered via real `/register`, auto-approved):
  - creator `creator@test.igovazd.am` / `Creator2026!` → `/account`
  - brand `brand@test.igovazd.am` / `Brand2026!` → `/account/brand`

## Phase 2 — LOCAL, dev-tested on :3001, UNCOMMITTED (26 files), NOT on prod

Executed with 4 parallel `coder` subagents + direct edits. `tsc --noEmit` = 0 across all; dev smoke green. **Prod still runs Phase-1 code — deploy only on explicit user command.**

1. **Admin project-form cleanup** (`project-form.tsx`, `projects/actions.ts`) — removed duplicate/unneeded fields per user's pick: Format (manual), generic Title/Synopsis (kept HY/RU/EN only; translate source → a locale field), Release label, Subgenre, CPM min/max, Budget min/max, Projected views, Sort order. `buildData` derives `title ← titleRu||titleHy||titleEn` (same for synopsis). DB columns/schema untouched (display fallbacks intact).
2. **Unified hero** — new `src/components/ui/page-hero.tsx` generalized from the `/about` hero (user likes it). Applied to catalog, portfolio, contact, how-it-works, privacy, terms; `about-hero.tsx` is now a thin wrapper. NOT home, NOT `report-hero.tsx`. `header.tsx` gained `DARK_HERO_PATHS` so header text switches light-on-dark over the new dark heroes.
3. **Registrations → Users merge** — `users/page.tsx` now has Staff / Members tabs (`users-tabs.tsx`); member block/unblock lives there (reuses `registrations/row-actions.tsx` + `actions.ts`); `registrations/page.tsx` deleted; nav entry + dead pending-badge removed from `admin-nav.tsx`. Side effect: `/admin/users` is `requireSuperadmin`, so PUBLISHER loses the member view (accepted — approval queue is dead under auto-approve).
4. **Creator form 1:1 with admin** — `/account/projects/new` now reuses the admin `ProjectForm` (`mode="creator"`, Visibility section hidden, `translateAction`/`posterAction` passed as creator-gated props). New `account/projects/translate-action.ts` (requireMember + CREATOR). `createCreatorProject` rewritten to the full field set, forcing `moderationStatus=PENDING`, `isActive=false`, `ownerId=creator`. `project-submit-form.tsx` deleted. **Note:** the shared form is English chrome (like admin) — a creator sees an English UI; localization is a follow-up.
5. **translate.ts resilience** (fast + reliable) — success is a single request (no added latency); on failure it immediately tries a fallback model (`gemini-3.1-flash-lite`) rather than waiting on the overloaded one; one re-sweep after 500ms; timeout 15s → 18s; default model fixed `gemini-2.5-flash` (404 for this key) → `gemini-flash-latest`. Addresses the prod 503/timeout the user hit.

## Pending — recorded, NOT started (unless noted)

Task list:
- **#12** (fully specced in `fix.md` + task) — delete **Applications** (admin inbox + anonymous `ApplyDialog` on cards/catalog/report), заявка/interest **only for registered brands** (`Interest`), contact form → email admin (decouple from `Application`), edit all "anonymous / аноним / անանուն" copy (i18n line refs listed), keep the `Application` table (no destructive drop). User: **no anonymous submissions**.
- **#11** — Cast & Crew person search: pull distinct prior `Actor` rows, searchable autocomplete in the cast/crew editor, prefill (role/kind/photo) + editable; admin + creator.
- **#10** — run `/qa` on functionality; log every bug to `fix.md` (report-only).

`fix.md` live bugs (recorded, not fixed):
- **Logout crashes on prod** ("Что-то пошло не так") — root cause: `memberLogout`/`staffLogout` use server-side `redirect()` inside the action; Hostinger/Passenger crashes it (login/register were already migrated to `{ok,redirect}` + client nav; logout was missed). Not reproducible locally (dev + local prod build both fine). Fix: make logout client-navigated.
- Login form missing password eye-icon (`PasswordInput` not used on `/login`).
- Creator project form is English-only (localization follow-up).

## Deploy note

Phase-2 work is local/uncommitted. To ship: commit → migrate is NOT needed (no schema change) → `git push main` → Hostinger auto-build → smoke. Indexing stays OFF.
