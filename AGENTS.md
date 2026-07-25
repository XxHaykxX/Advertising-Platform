<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repo layout

The FP Placement marketplace app (Next 16, dev port 3001) now lives at the **repo root** — `package.json`, `src/`, `prisma/`, `public/` are top-level. Default language `hy` (ru/en/hy via the locale cookie). It was moved up from the former `placement/` subdirectory on 2026-07-09 so Hostinger's git auto-deploy (which builds from the repo root) finds `package.json`. The legacy films-landing app that used to share the repo root (port 3000, MySQL db `adplatform_site`) was removed on 2026-07-08.

Deploy target: Hostinger shared Node.js (git auto-deploy on push to `main`), prod MySQL `u998961932_advertising` at `127.0.0.1:3306`, domain `igovazd.am`. Env vars (`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`) are set in the hPanel Node.js app config, not committed (`.env` is gitignored). Indexing stays OFF (noindex + robots disallow).

# Auth & roles (added 2026-07-14)

Four staff roles (sign in at `/admin/login`): `SUPERADMIN` (everything), `PUBLISHER` (content editor), `MODERATOR` (project moderation only), `TRANSLATOR` (UI dictionary editor). Two self-serve member roles (`BRAND`, `CREATOR` — sign in at `/login`). Members self-register at `/register` and are **auto-approved** (`AccountStatus=APPROVED`) and signed in immediately — moderation happens at the *project* level, not the account level (decision #12, 2026-07-15). The admin `/admin/registrations` page + pending-count badge exist for the manual approve/reject/block workflow but self-registrations never enter `PENDING`, so that queue stays empty unless an account is created/blocked another way. Only `APPROVED` members can sign in. On login, `CREATOR` lands in `/account` (submit / my-projects), `BRAND` is redirected to `/account/brand` (browse / interests / profile — the buyer cabinet). `requireUser()` = staff-only (guards `/admin` + `src/proxy.ts`), `requireMember()` = approved member (guards `/account`); both re-check the DB per request. Auth code lives in `src/lib/auth/` (`members.ts`, `require.ts`, `password.ts`, `session.ts`, `google.ts`).

**Naming:** the non-brand side is **Создатели / Creators / CREATOR** — never "режиссёр"/"filmmaker".

**Google/Gmail sign-up** is scaffolded but inert until `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set in env (Web OAuth client, redirect `…/api/auth/google/callback`). Empty creds hide the button.

Full details: `docs/archive/Session-Progress-2026-07-14.md`.

# i18n editor & TRANSLATOR role (added 2026-07-25)

A third staff role, `TRANSLATOR` (content writer), signs in at `/admin/login` and lands
straight on `/admin/i18n` — the only section it can reach. It edits the UI dictionary
(`src/lib/i18n.ts`) there; "Save & publish" validates the edits and commits the file to
`main` via the GitHub Contents API (`src/lib/github/contents.ts`), which triggers the usual
Hostinger auto-deploy. The Google Sheet that used to hold these translations is now archived
— see `docs/i18n-editor.md`. Requires prod migration `docs/prod-migrations/2026-07-25-i18n-editor.sql`
applied **before** push (per `docs/DEPLOY-PLAYBOOK.md`).

# Документация

Карта всех доков проекта (живые/справочные/архив) — `docs/INDEX.md`. Чеклист деплоя на
Hostinger (перед push / после push, известные грабли) — `docs/DEPLOY-PLAYBOOK.md`.
