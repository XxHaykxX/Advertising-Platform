# Kickoff prompt — FP Placement Phase 1

Paste the block below into a fresh Claude CLI session (in this repo) to start execution.

---

Ты оркестратор (Fable 5). Реализуй **FP Placement, Фаза 1 (full-stack)** по готовому утверждённому плану — дизайн уже согласован, «поехали» дано.

**Читай сначала:**
- План: `docs/superpowers/plans/2026-07-08-fp-placement-phase1-fullstack.md`
- Спек: `docs/FP-Placement-Spec.md`
- Память проекта: `[[project-placement-redesign]]`, `[[project-advplatform]]`

**Как исполнять:** через skill `superpowers:subagent-driven-development`, строго по ВОЛНАМ плана:
- **Волна 0** — последовательно, 1 агент (`coder`, sonnet): scaffold + Prisma-схема + БД `placement` (MySQL 3307) + prisma-client + seed. Затем ревью `architect`(opus).
- **Волна 1** — 3 агента ПАРАЛЛЕЛЬНО (один message, несколько Agent-вызовов): 1-A auth (`coder` sonnet), 1-B токены+UI-примитивы (`coder` sonnet, скиллы frontend-design+ui-ux-pro-max), 1-C data-слой (`coder` sonnet). Затем ревью `architect`.
- **Волна 2** — много агентов ПАРАЛЛЕЛЬНО: публичные секции (простые презентационные — `coder` **haiku**; сложные/data-bound и report-секции — `coder` **sonnet**) + админ-CRUD (`coder` sonnet). Файлы у каждого агента непересекающиеся. Затем ревью `architect`.
- **Волна 3** — последовательно, 1 агент (`coder` sonnet): сборка страниц + Playwright-smoke + очистка черновиков.

**Модели по задачам** — см. таблицу «Orchestration: agent · model · skills» в шапке плана. haiku=механика/презентация; sonnet=логика/данные/auth/server-actions/сложный UI; opus=ревью-гейты; Fable5=только оркестрация.

**ОБЯЗАТЕЛЬНО:** каждый code-агент перед framework-кодом дёргает **Context7** (`mcp__claude_ai_Context7__query-docs`) по своей теме (Next 16 App Router/server actions/middleware, Tailwind v4 `@theme`, Prisma, framer-motion, lenis, jose) — стек свежий, `AGENTS.md` предупреждает «это не тот Next.js».

**Изоляция:** весь новый код в `placement/` (отдельный Next-app, порт 3001, БД `placement` порт 3307). Старый `src/…` НЕ трогать — только копировать паттерны.

**Правила:** между волнами — ревью `architect`, чинить находки до следующей волны. Коммит после каждой задачи (как в плане). Веб-браузинг — Playwright MCP, не gstack. Отвечать по-русски.

Начинай с Волны 0.

---
