# Session progress — 2026-07-20 (local batch, NOT deployed)

**Rule in force:** the user is working **locally only** — do NOT push/deploy until they say so. Local commits are fine (a push is what deploys via Hostinger auto-deploy). Local dev runs on `http://localhost:3001` (`npm run dev`); DB = Docker MySQL `adplatform-mysql` on `127.0.0.1:3307`, db `placement`.

Prod HEAD (deployed) = `0fed7d2`. Everything below is on top of it and (unless committed) lives in the working tree.

## Deployed earlier today (on prod)
- `963f64a` poster/uploads fix (Node route `/uploads`, cheaper flash model default, per-user rate-limit) + admin Media file-manager.
- `9e9d662` uploads persistence: in prod, `UPLOADS_DIR` defaults to `…/domains/igovazd.am/uploads` (sibling of the deploy-wiped `nodejs/` app dir). Live uploads dir on prod = `/home/u998961932/domains/igovazd.am/uploads`.
- `0fed7d2` admin Media page = folder uploader + grid grouped by folder.
- **503 incident** root cause: account **Max Processes limit = 120** exhausted by a burst of builds/restarts/crons — NOT code. Fix: hPanel → “Stop running processes” → Start. Lesson: deploy one at a time, spaced.
- Old prod media (cast/posters uploaded before) were **permanently wiped** by earlier deploys (they lived inside `nodejs/`). Not recoverable except a Hostinger backup. `/kino/*` + `/hero/*` are committed seed images (present). Copied `/kino`+`/hero` into the persistent uploads dir so they show in admin Media.

## Uncommitted local work (this batch)

### 1. Interests removed from admin
- Deleted `src/app/admin/(panel)/interests/` (page/actions/row-actions).
- `admin-nav.tsx`: removed the Interests nav item + `Heart` import.
- `account/brand/actions.ts`: notification link `/admin/interests` → `/admin` (avoid 404).

### 2. Users → “Create member” with role select
- `users/actions.ts`: `createPublisher` → **`createMember`**; role from form, validated to `SUPERADMIN | MODERATOR` (Publisher removed).
- `users/new/page.tsx`: title “New publisher” → “Create member”, imports `createMember`.
- `users/page.tsx`: button “New publisher” → “Create member”.
- `users/user-form.tsx`: added **Role select** (Super-admin / Moderator, default Super-admin); “Company name” → “Name”; button “Create publisher” → “Create member”.

### 3. Media picker (reusable popup: library + upload-from-computer)
New files:
- `src/components/media-picker.tsx` — modal. Scope `"staff"` (listUploads/uploadImage, folder chips, whole library) or `"member"` (listMemberUploads/uploadMemberImage, own files only). Click image = select; “Upload from computer” uploads then adds.
- `src/components/media-field.tsx` — replaces the old “type a URL” image inputs: preview + Browse + hidden `input[name]`.
- `src/lib/actions/member-uploads.ts` — `uploadMemberImage` / `listMemberUploads` / `deleteMemberUpload`, all `requireMember`, hard-scoped to `/uploads/members/<userId>/…` so a creator sees only their own.
- `src/lib/uploads-usage.ts` — shared (auth-free) `findUploadUsage(path)` used by both staff & member delete.
Wiring:
- `uploads.ts`: `deleteUpload` now imports `findUploadUsage` from `uploads-usage.ts` (removed the duplicate; dropped `prisma` import). Blocks deleting a file still referenced.
- `image-uploader.tsx`: added `scope` + a **Browse** button opening the picker; **removed the direct “Upload” button** (upload lives inside the picker now). `label` prop kept but unused.
- `project-form.tsx`: `uploaderScope = mode === "creator" ? "member" : "staff"`, passed to poster + gallery `ImageUploader` and to `ActorsSection` (+ `browseLabel={t("btn.browse")}`).
- `actors-editor.tsx`: `scope` prop → cast-photo `ImageUploader`.
- `partner-form.tsx`: logo `<input>` → `<MediaField name="logo" uploadDir="partners" />`.
- `portfolio-form.tsx`: image `<input>` → `<MediaField name="image" uploadDir="portfolio" />`.
- `i18n.ts`: added `btn.browse` (ru «Выбрать» / en «Browse» / hy «Ընտրել»).
- Creator forms reuse admin `project-form.tsx` (mode="creator") — so creator picker is member-scoped automatically. `uploadImage` is staff-only, so member upload REQUIRED the new `uploadMemberImage` (creator upload was effectively broken before).

### 4. Project delete — full cascade + styled confirm
- `projects/actions.ts` `deleteProject`: collects the project’s own image paths (poster + gallery JSON + cast photos), deletes the DB row (cascades actors/tiers/interests/favorites via schema), then `deleteUpload`s each `/uploads/` file — `deleteUpload` skips any file still referenced elsewhere, so shared images survive. Helper `collectProjectImagePaths`.
- `src/components/confirm-dialog.tsx` (NEW) — styled modal (card/border/primary tokens, danger icon, Escape-to-cancel).
- `projects/row-actions.tsx`: `DeleteButton` uses `ConfirmDialog` instead of native `confirm()`.

### 5. Member confinement (proxy.ts)
- `src/proxy.ts`: matcher widened to the whole site (`"/((?!_next/static|_next/image|favicon.ico|api|uploads|.*\\.).*)"`). Logged-in **BRAND/CREATOR** outside `/account/*` → redirected to their cabinet (CREATOR→`/account`, BRAND→`/account/brand`), even via URL bar. Staff/anon unaffected. `src/proxy.ts` IS the middleware entry in this Next fork (no `middleware.ts`).

## Local test accounts (in Docker DB `placement`)
- Admin (staff): `admin@admin.com` / `admin1234` → `/admin/login`.
- Creator: `creator@test.igovazd.am` / `Creator2026!` (also `creator@test.com` / `creator1234`) → `/login` → `/account`.
- Brand: `brand@test.igovazd.am` / `Brand2026!` (also `brand@test.com` / `brand1234`) → `/login` → `/account/brand`.
- **Login rate-limit gotcha:** ≥10 failed member logins (or ≥5 admin) → in-memory limiter returns the SAME “wrong email/password” text; restart dev to clear. Reset an admin/member password by bcrypt-hashing and `UPDATE User SET passwordHash=…`.

## NEXT (planned, approved, NOT started) — Creator sidebar + profile + sticky sidebars
User will `/compact` first, then say go. Decisions locked:
- **Creator left sidebar** (mirror `account/brand/brand-sidebar.tsx`): items **My projects** (`/account`, exact), **Submit** (`/account/projects/new`), **Notifications** (`/account/notifications`, unread badge), **Profile** (`/account/profile` — NEW page to build), **Log out** (`account/actions.ts` `logout`). No back button (sidebar is enough).
- **Creator Profile page (NEW)** `/account/profile`: edit creator name + avatar. Avatar via `MediaField … scope="member"` (or an ImageUploader scope="member"). Needs a new page + form + a `requireMember` server action that updates `User.name` / `User.avatar`. (Creator avatar is already used as the poster logo source.)
- **Layout**: `account/layout.tsx` currently = SiteHeader + main + Footer (no sidebar); BRAND gets its sidebar via nested `account/brand/layout.tsx`. Add the creator two-column shell (sidebar + content) for **CREATOR only** in `account/layout.tsx` (branch on `requireMember().role`), so BRAND (nested layout) doesn’t get two sidebars. Mirror brand layout’s `Container` + `flex lg:flex-row` + `<main flex-1>`.
- **Sticky (non-scrolling) sidebar** for **creator + admin** (brand optional, do for consistency):
  - `admin-shell.tsx`: desktop `<aside>` is `md:static` today → make it `md:sticky md:top-0 md:h-screen overflow-y-auto` (keep the mobile off-canvas drawer as-is).
  - Creator sidebar `<aside>` / brand `<aside>`: `lg:sticky lg:top-0 lg:h-[calc(100vh-…)]` or `lg:self-start lg:sticky lg:top-6` with its own scroll.
- After building: `npx tsc --noEmit` (ignore the stale `.next/types/.../interests/page.js` error — auto-heals), warm pages locally, tell user to test. Do NOT deploy.
