# Session Progress — 2026-07-14

Summary of all changes made in the 2026-07-14 working session. Dev app runs on port 3001; local DB is the Docker container `adplatform-mysql` (MySQL 8) at `127.0.0.1:3307`, db `placement`.

## 1. Report page (`/reports/[id]`)

- **"Read more" (synopsis)** → renamed to **"More"** and only shows when the clamped text actually overflows 3 lines (`synopsis-disclosure.tsx` measures `scrollHeight > clientHeight`). Labels: ru «Ещё», en "More", hy «Ավելին».
- **Removed** the meaningless "Full details unlocked after mutual interest" notice (dropped `express.lockedNotice`, the Lock icon, and the left block of `roi-snapshot.tsx`'s Express-Interest banner).
- **Report nav tabs**: removed the "Investment" tab from `report-tabs.tsx` (nav only; the `#investment` section still renders).
- **Poster slider** (`poster-slider.tsx`): loops — Next on last → first, Prev on first → last.
- **Storyboard** under the synopsis: now a single continuously auto-scrolling row that can also be **dragged with the mouse** (`storyboard-marquee.tsx`, client). rAF auto-scroll (~70s loop, wraps at half-width), pointer-drag to scroll, pause on hover, `cursor-grab`, drag suppresses the click. Project 32 gallery set to 20 frames. (Earlier iterations — a 35mm film-strip and a hero+thumbnails gallery — were built then replaced; final is the marquee.)

## 2. Homepage

- **Removed** the stats block ($5 CPM / 85% / 2.5M+ / 74%, PQ Media/Nielsen/Statista/IPG) — dropped `<Stats/>` from `page.tsx` (component file kept).
- **Moved** "How It Works" to immediately after the Hero.
- **Header** (`header.tsx`): merged separate "Sign in" + "Register" links into a single primary button **"Sign In / Up"** (`nav.signInUp`, LogIn icon that slides on hover, `btn-glow`), pointing to `/login`. Removed the "Browse Projects" (`nav.browseProjects`) button; its primary style/animation was transferred to the new button.

## 3. Naming: режиссёр → Создатели

The non-brand side is now **Создатели / Creators / CREATOR** everywhere (was «режиссёр»/"filmmaker" — wrong, too narrow). Renamed across ru/en/hy in `i18n.ts` (all cases) and the referencing component keys (`forCreators`, `forCreatorsTitle`, etc.). RU «Создатели», EN "Creators", HY «Ստեղծագործող».

## 4. Brand/Creator authentication + admin approval (main feature)

Self-serve accounts for **Brands** and **Creators**, gated by admin approval.

### Data model (`prisma/schema.prisma`)
- `Role` enum += `BRAND`, `CREATOR` (staff = `SUPERADMIN`, `PUBLISHER`).
- New `AccountStatus` enum: `PENDING | APPROVED | REJECTED | BLOCKED` (default `APPROVED`; self-registration sets `PENDING`).
- `User` += `status AccountStatus`, `company String?`, `googleId String? @unique`, and `passwordHash` made optional (Google-only accounts have none).

### Auth core (`src/lib/auth/`)
- `members.ts` — `createMember` (PENDING), `authenticateMember` (rejects staff, gates pending/blocked/rejected, constant-time on unknown email), `setMemberStatus` (scoped to member rows via `updateMany`), `createGoogleMember`, `findMemberByGoogleId`.
- `require.ts` — `requireUser()` narrowed to **staff only** (BRAND/CREATOR bounced from `/admin`); new `requireMember()` = approved active BRAND/CREATOR. Both re-check the DB every request → blocking a member is instant.
- `password.ts` — null-`passwordHash` guards.
- `session.ts` — unchanged JWT `adm_session` cookie, shared by staff + members (authz re-derives role from DB).
- `google.ts` — minimal Google OAuth 2.0 helpers (authUrl / token exchange / userinfo / signed short-lived cookies).
- `src/proxy.ts` — `/admin` gate now treats **only staff JWTs as authed** (a member token is shown the login page instead of looping).
- `src/app/admin/actions.ts` — admin login rejects BRAND/CREATOR even with a correct password.

### Public pages
- `/register` — form with account-type toggle (Brand/Creator), name, email, password, company; creates a PENDING member, shows "awaiting approval" (no session). Server-side email regex + 8-char password check.
- `/login` — authenticates members; per-IP rate limit; shows pending/blocked/rejected messages (and `?status=`/`?error=google` banners). On success → `/account`.
- Header exposes the single "Sign In / Up" button.

### Member cabinet (`/account`)
- `layout.tsx` gates via `requireMember()`. `page.tsx` shows profile (name/email/company/role/status) and role-specific cards — Creator: "Upload script" + "My projects" placeholders; Brand: "Browse catalog" CTA → `/catalog`. Logout server action clears the cookie.

### Admin (`/admin/registrations`)
- Lists BRAND/CREATOR users (PENDING first) with Approve / Reject / Block / Unblock (server actions guarded by `requireUser`, i.e. staff).
- `admin-nav.tsx` shows a **pending-count badge** = the "new registration" notification (via `getPendingCount` server action).

### Google / Gmail OAuth — SCAFFOLDED, needs credentials
- Reads `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` from `.env`. Empty → "Continue with Google" button is hidden (`googleConfigured()` false) and `/api/auth/google/start` redirects to `/login?error=google`.
- Routes `/api/auth/google/{start,callback}`. New Google users → `/register/complete` to pick account type + company (the data Google doesn't provide) → PENDING member. Existing email is linked to the Google id; staff rejected; blocked/pending/rejected get their messages.
- **To enable:** create a Web OAuth client in Google Cloud Console, authorized redirect URI `http://localhost:3001/api/auth/google/callback`, paste creds into `.env`, restart dev.

### Verification
Full local e2e (via headless browse) passed for every email/password variant: register brand + creator → PENDING; login-before-approval → pending; admin sees both + badge=2; approve/reject; creator & brand cabinets (distinct views); member→/admin bounce (no redirect loop); block → login blocked; duplicate email; short password. Architect security review ran; its HIGH (proxy loop) + LOW/MEDIUM findings (member rate-limit, scoped status update, constant-time login, email validation) were all fixed. Google flow not yet tested (awaiting creds). `npx tsc --noEmit` clean.

## Follow-ups
- Provide Google OAuth credentials to finish/enable Gmail sign-up, then run the Google e2e.
- Cabinet placeholders (creator script upload, projects) are stubs for later.
