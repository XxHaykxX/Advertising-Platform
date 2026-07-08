<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `placement/node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repo layout

The only app in this repo is `placement/` (Next 16, dev port 3001) — the FP Placement marketplace, default language `hy` (ru/en/hy via the locale cookie). The legacy films-landing app that used to live at the repo root (port 3000, MySQL db `adplatform_site`) was removed on 2026-07-08; its last deployed revision still runs on Hostinger until the deploy pipeline is repointed at `placement/`.
