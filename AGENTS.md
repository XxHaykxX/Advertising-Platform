<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repo layout

The FP Placement marketplace app (Next 16, dev port 3001) now lives at the **repo root** — `package.json`, `src/`, `prisma/`, `public/` are top-level. Default language `hy` (ru/en/hy via the locale cookie). It was moved up from the former `placement/` subdirectory on 2026-07-09 so Hostinger's git auto-deploy (which builds from the repo root) finds `package.json`. The legacy films-landing app that used to share the repo root (port 3000, MySQL db `adplatform_site`) was removed on 2026-07-08.

Deploy target: Hostinger shared Node.js on `skyblue-barracuda-730366.hostingersite.com` (git auto-deploy on push to `main`), prod MySQL `u998961932_advertising` at `127.0.0.1:3306`, domain `igovazd.am`. Env vars (`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`) are set in the hPanel Node.js app config, not committed (`.env` is gitignored). Indexing stays OFF (noindex + robots disallow).
