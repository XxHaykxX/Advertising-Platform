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

---

## DONE after that plan (2026-07-20, still local-only, NOT deployed)

Local commits stacked on prod HEAD `0fed7d2`: `9dce696` → `8d0847a` → `8493524` → `aa6d272` → `7dd8bcb` (favorites feature was folded into `7dd8bcb`).

### Creator cabinet (commit 9dce696)
- `src/app/account/creator-sidebar.tsx` (NEW) — mirror of brand sidebar: Главная (`/account`, exact) / Мои проекты (`/account/projects`) / Подать проект (`/account/projects/new`) / Уведомления (`/account/notifications`, unread badge) / Профиль (`/account/profile`) / Выйти. `lg:sticky`.
- `account/layout.tsx` — two-column CREATOR shell (Container + flex + sidebar + main); BRAND untouched (keeps nested `account/brand/layout.tsx`). Creator pages (dashboard/projects/new/notifications) stripped of their own `Section`/`Container` (shell provides it).
- NEW `/account/profile` page + form + `updateCreatorProfile` action (name + avatar via member-scope MediaField).
- Sticky: `admin-shell.tsx` aside `md:static`→`md:sticky md:top-0 md:h-screen overflow-y-auto`; brand+creator aside `lg:sticky lg:top-20` (top-20 because SiteHeader is `sticky top-0 h-16`).

### Admin Broadcast (commit 8d0847a, architect-reviewed)
- `/admin/broadcast` (SUPERADMIN, nav item Send/`canManageUsers`) — two tabs Push + Email; audience all/brands/creators (APPROVED+active) with live counts. New `BROADCAST` notification type + free-text title/message + render case + Megaphone icon. Email fan-out batched 8-at-a-time (architect fix — was blasting all SMTP sockets). Internal-only link guard, HTML-escaped body.

### Creator profile enrichment + projects cleanup (commit aa6d272; spec `docs/superpowers/specs/2026-07-20-creator-profile-and-projects-cleanup-design.md`)
- Profile: editable phone + website/portfolio; read-only stats (member-since / role / status / projects total+approved). `updateCreatorProfile` caps name 120 + validates avatar to own `/uploads/members/<id>/` (architect fixes).
- `/account/projects`: removed the redundant header "Submit" button (sidebar covers it).
- Schema `User.phone` (migration `docs/prod-migrations/2026-07-20-user-phone.sql`), `website` repurposed brand+creator.

### Brand Favorites rename + Web Push + live toaster (commit 7dd8bcb)
- **Favorites**: brand sidebar "My Interests"→**"Избранное"**, repointed to NEW `/account/brand/favorites` (lists hearted projects from the Favorite table). Interest badge dropped; Interest-заявки removed from the brand menu (heart = private favorite, admin never sees it). Old `/account/brand/interests` route left orphaned.
- **Web Push** (real system push, works site-closed / on phone — user requirement): `web-push` dep + VAPID keys (in local `.env`), `PushSubscription` table (migration `docs/prod-migrations/2026-07-20-push-subscription.sql`), `public/sw.js` service worker, `src/lib/push/web-push.ts` (send + prune 404/410), `src/lib/actions/push.ts` (save/delete subscription, dedup by TEXT endpoint). Hooked into `createNotification` + `notifyRoles` + admin broadcast. `push-subscribe.tsx` enable-prompt mounted in `account/layout.tsx`.
- **Live toaster** `notification-toaster.tsx` — polls unread every ~10s, pretty slide-in, dedup via localStorage. `getUnreadNotificationsPreview` action.
- Why NOT websocket: Hostinger Passenger kills long-lived sockets AND websocket can't deliver when the site is closed — only Web Push does.

### PROD deploy checklist for this batch (when the user says go)
1. Apply BOTH migrations on prod BEFORE push: `2026-07-20-user-phone.sql`, `2026-07-20-push-subscription.sql`.
2. Add to hPanel Node env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:hello@igovazd.am`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (values in local `.env`).
3. `web-push` + `@types/web-push` are in `dependencies` (Hostinger prunes devDeps at build).
4. One controlled deploy (process-limit lesson).

### STILL OPEN
- **Sticky cabinet sidebar** — user says "doesn't stick". Offset fixed (top-20). Hypothesis: short dashboard has too little two-column scroll before the footer for sticky to show. Lenis/`overflow-x:clip` do NOT break sticky. Needs a browser test on a tall page (profile/catalog); if it fails there too, switch to a hard-pinned pattern like admin-shell.
- Live push delivery not yet verified end-to-end (needs a real browser: grant permission → broadcast → confirm system notification with tab closed).

---

## DEPLOYED (2026-07-20 second wave) — prod HEAD `0d81a39`

Pushed `0fed7d2 → bcef025 → 0d81a39`. Prod DB migrated by me remotely (docker mysql client → `srv2026.hstgr.io`, creds from `.env.hostinger`): `User.phone`, `PushSubscription`. First build (bcef025) FAILED — `@types/web-push` was in devDependencies (Hostinger prunes devDeps → tsc "Could not find declaration file for web-push"); diagnosed via unauthed route markers (new route → 307, old → 404) since MCP build logs were unavailable; fixed by moving it to dependencies (`0d81a39`). New build live: `/sw.js`=200, all new routes serve. User added 3 VAPID vars to hPanel + restart. VAPID also appended to `.env.hostinger` (gitignored). Web Push public key is a runtime prop (not NEXT_PUBLIC) so it activates with env + restart, no rebuild.

## LOCAL batch after deploy (commit `fadd67c`, NOT pushed — user said "not yet")

Prod stays `0d81a39`. This sits on top locally.
- **Image optimization** `src/lib/images/optimize.ts` (sharp) wired into all three write paths (staff `uploads.ts`, member `member-uploads.ts`, generated `uploads-fs.ts`). Output **WebP**: avatar/logo 512×512 contain+alpha (q85), cast 800×800 cover (q80), everything else 16:10 ≤1600×1000 cover (q80); EXIF auto-rotate. Measured −41% wide / −92% avatar. New uploads/generations only.
- **All display blocks unified to 16:10** except the two 1:1 squares (avatar/logo, cast). Fixed: creator My-projects (was 2:3), hero, page-hero, storyboard-marquee, portfolio lightbox, poster-gen preview (all aspect-video). Admin tables already 16:10 (h-10 w-16); partner logo stays object-contain.
- **Upload size hint** `src/lib/images/size-hint.ts` (client-safe) under every image field in ImageUploader + MediaField (admin + creator).
- **Cabinet footer** minimal variant (brand+creator) in `footer.tsx` — drops public nav columns, keeps wordmark + contacts (email/**phone**/Telegram/WhatsApp) + locale/currency; wired via `account/layout.tsx` `<Footer minimal/>`.
- **Header** hides the language bar in the top nav for members (`!isMember`, desktop+mobile) — it lives in the footer now.
- No migrations. Deploy = push → rebuild.

## STILL OPEN (unchanged)
- Sticky cabinet sidebar (offset fixed to top-20; needs a tall-page browser test).
- Live Web Push end-to-end verification on prod.
