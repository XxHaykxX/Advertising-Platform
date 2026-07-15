<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repo layout

The FP Placement marketplace app (Next 16, dev port 3001) now lives at the **repo root** — `package.json`, `src/`, `prisma/`, `public/` are top-level. Default language `hy` (ru/en/hy via the locale cookie). It was moved up from the former `placement/` subdirectory on 2026-07-09 so Hostinger's git auto-deploy (which builds from the repo root) finds `package.json`. The legacy films-landing app that used to share the repo root (port 3000, MySQL db `adplatform_site`) was removed on 2026-07-08.

Deploy target: Hostinger shared Node.js (git auto-deploy on push to `main`), prod MySQL `u998961932_advertising` at `127.0.0.1:3306`, domain `igovazd.am`. Env vars (`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`) are set in the hPanel Node.js app config, not committed (`.env` is gitignored). Indexing stays OFF (noindex + robots disallow).

# Auth & roles (added 2026-07-14)

Two staff roles (`SUPERADMIN`, `PUBLISHER` — sign in at `/admin/login`) and two self-serve member roles (`BRAND`, `CREATOR` — sign in at `/login`). Members self-register at `/register` into `AccountStatus=PENDING`; an admin approves/rejects/blocks them at `/admin/registrations` (pending-count badge in `admin-nav` = the notification). Only `APPROVED` members can sign in; they land in the `/account` cabinet. `requireUser()` = staff-only (guards `/admin` + `src/proxy.ts`), `requireMember()` = approved member (guards `/account`); both re-check the DB per request. Auth code lives in `src/lib/auth/` (`members.ts`, `require.ts`, `password.ts`, `session.ts`, `google.ts`).

**Naming:** the non-brand side is **Создатели / Creators / CREATOR** — never "режиссёр"/"filmmaker".

**Google/Gmail sign-up** is scaffolded but inert until `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set in env (Web OAuth client, redirect `…/api/auth/google/callback`). Empty creds hide the button.

Full details: `docs/Session-Progress-2026-07-14.md`.
