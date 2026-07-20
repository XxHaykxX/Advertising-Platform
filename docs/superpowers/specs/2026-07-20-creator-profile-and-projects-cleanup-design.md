# Creator profile enrichment + projects page cleanup — design

Date: 2026-07-20
Status: approved (local-only work; no deploy until user says so)

## Problem

1. `/account/projects` shows three ways to "Submit project" on one screen —
   the header button (top-right), the empty-state button, and the new sidebar
   item. The header button duplicates the sidebar. It must go.
2. The creator profile page (`/account/profile`) is thin: only name + avatar +
   read-only email. Creators should have contact fields and a read-only stats
   summary so a brand can reach them and see their track record.

## Scope

In scope:
- Remove the header "Submit project" button on `/account/projects`.
- Add editable **phone** + **website/portfolio** to the creator profile.
- Add a read-only **stats** block to the creator profile.
- Fold in two security fixes flagged in review of `updateCreatorProfile`.

Out of scope (explicitly declined by user): city, bio, studio, socials,
separate `portfolioUrl` column.

## Part 1 — projects page

File: `src/app/account/projects/page.tsx`

- Remove the header `<Button asChild variant="primary">` ("Подать проект" → 
  `/account/projects/new`) and the flex wrapper that only existed to right-align
  it. The header becomes just the `<h1>` + subtitle `<p>`.
- Keep the empty-state button ("Подать первый проект") — it is a contextual CTA
  shown only when the creator has zero projects, and the sidebar covers the
  general case.
- Remove now-unused imports (`Button`, `Plus`) if nothing else uses them.

## Part 2 — creator profile

### Data model

`prisma/schema.prisma`, `model User`:
- Reuse the existing nullable `website String?` column (currently commented as
  "BRAND-only" but it is just a nullable string — repurpose for creators too;
  update the comment to say brand + creator).
- Add ONE new column: `phone String?` (nullable, no backfill needed).

Migration (log to `docs/prod-migrations/2026-07-20-user-phone.sql` for prod,
apply locally now, do NOT deploy):
```sql
ALTER TABLE `User` ADD COLUMN `phone` VARCHAR(191) NULL;
```
Apply locally with `npx prisma db push` (or `migrate dev`) against the Docker DB.

### Server action

File: `src/app/account/actions.ts`, `updateCreatorProfile`:
- Read `phone` and `website` from the form alongside `name` + `avatar`.
- Persist all four (`phone`/`website` → `value || null`).
- **Security fixes (from architect review):**
  - Cap `name` length at 120 chars (`name.slice(0, 120)` after trim, or reject
    if longer — pick trim-and-cap so a long paste doesn't error).
  - Validate `avatar`: accept only `""` or a path starting with
    `/uploads/members/${user.id}/`. Anything else → coerce to `""` (a creator
    must not point their avatar at another member's uploads or an external
    beacon URL).
- Keep the existing `requireMember()` + `role === "CREATOR"` gate and
  `revalidatePath` calls.

### Page

File: `src/app/account/profile/page.tsx`:
- Fetch `phone`, `website`, `createdAt`, `role`, `status` in the existing
  `findUnique`, plus two counts: total projects and approved projects
  (`prisma.project.count({ where: { ownerId, ... } })`).
- Pass everything to the form + a new stats block.
- Render a **read-only stats block** (cards or a definition list) above/below
  the form: Дата регистрации (localized date), Роль (Создатель), Статус
  (Одобрен), Проектов всего N, Одобрено M. No new columns — all derived.

### Form

File: `src/app/account/profile/profile-form.tsx`:
- Add two text inputs to the editable "Профиль" card: **Телефон** (`name="phone"`,
  `type="tel"`) and **Сайт / портфолио** (`name="website"`, `type="url"`).
- Keep name + avatar (MediaField, member scope). Email stays read-only.
- Thread `phone` + `website` initial values through props.

### i18n

Add keys (ru/en/hy) in `src/lib/i18n.ts`:
- `account.profile.phone` — Телефон / Phone
- `account.profile.website` — Сайт / портфолио / Website
- `account.profile.stats` — Статистика / Overview (section heading)
- `account.profile.memberSince` — На платформе с / Member since
- `account.profile.projectsTotal` — Проектов / Projects
- `account.profile.projectsApproved` — Одобрено / Approved
- Reuse existing: `account.roleCreator`, `account.statusApproved`,
  `account.brand.saveChanges`, `account.brand.saved`.

## Testing / verification

- `npx tsc --noEmit` clean (ignore stale `.next/types/.../interests` error).
- Manual: log in as creator (`creator@test.igovazd.am / Creator2026!`), open
  `/account/profile` — see stats + edit phone/website/name/avatar, save, reload,
  values persist. Open `/account/projects` — only one submit affordance in the
  header area (the empty-state CTA when zero projects), sidebar unchanged.
- No deploy. Local commit only.

## Risks

- Prisma client regen lock if dev server holds the file (known gotcha) — stop
  dev before `db push` if it errors, restart after.
- `website` reuse: brand profile already writes this column; creators writing it
  is additive and independent (different rows) — no conflict.
