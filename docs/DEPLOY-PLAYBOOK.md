# Деплой на прод (igovazd.am) — чеклист

Свод уроков деплоя из живых доков и `tasks.md`/`fix.md`. Каждый пункт со ссылкой на источник —
это не новые правила, а компакт уже известного.

## Как устроен деплой

- Hostinger shared Node.js, **git auto-deploy на push в `main`**, билд запускается из **корня
  репозитория** (`AGENTS.md` — «Repo layout»; поэтому приложение и лежит в корне, а не в
  `placement/`).
- Билд-цепочка Hostinger выполняет **только** `npm install` (→ postinstall `prisma generate`)
  + `next build`. Она **НЕ** гоняет `prisma db push` / `migrate` / `db seed`
  (`docs/archive/Prod-Deploy-2026-07-15.md`).
- Прод MySQL: `u998961932_advertising` на `127.0.0.1:3306` (изнутри Hostinger) /
  `srv2026.hstgr.io:3306` (снаружи), домен `igovazd.am` (`AGENTS.md`).

## Перед push

1. **Миграция прод-БД — ДО push, вручную.** Если менялась `schema.prisma`, применить diff на
   прод БД (remote `prisma db push` или SQL) заранее — иначе свежесгенерированный Prisma-клиент
   выберет колонки, которых нет в проде, и всё упадёт в рантайме (`docs/archive/Prod-Deploy-2026-07-15.md`,
   `tasks.md`, `fix.md`). SQL миграций хранить в `docs/prod-migrations/`.
2. **Env-переменные, если новые** — добавить в hPanel Node.js app config **до** рестарта
   приложения (`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`, `UPLOADS_DIR`, ключи
   Google AI/SMTP и т.п.). Значения не коммитятся, `.env` в `.gitignore` (`AGENTS.md`).
   Пароль БД — избегать URL-спецсимволов (`#`, `@`, `/`, `?`); если ротировали пароль,
   обязательно обновить `DATABASE_URL` в hPanel синхронно (`docs/archive/Prod-Deploy-2026-07-15.md`,
   инцидент с аутентификацией БД).
3. **`@types/*`, нужные при билде — держать в `dependencies`, не в `devDependencies`.**
   Прод-билд Hostinger режет devDependencies; локальный билд (у которого devDeps на месте)
   эту ошибку не ловит (memory `deploy-types-in-deps`). Это касается не только `@types/*`, но
   и любого файла, который тайпчекается при `next build` и импортирует devDep (пример:
   `vitest.config.ts` / `*.test.ts` — фикс был через `tsconfig.exclude`, коммит `ed9cb98`,
   см. `tasks.md`/`fix.md`).
4. Прогнать `npx tsc --noEmit` и тесты локально — зелёный гейт перед push.

## После push

5. **Push ≠ live.** Билд на Hostinger может **молча упасть**, и прод продолжит отдавать
   старую версию — снаружи это выглядит как «фикс не применился», хотя код запушен
   (реальный случай: коммит `0bc603e`, см. `MEMORY.md`/`tasks.md`). Обязательно проверять
   статус билда (`hosting_listNodeJSBuildsV1` = `completed`), не доверять факту push.
6. Смоук-тест ключевых страниц (`/`, `/ads`, `/reports/[id]`, `/admin/login`, `/login`,
   `/register`) — см. пример прогона в `docs/archive/Prod-Deploy-2026-07-15.md`. (`/catalog`
   с 14.08.2026 — редирект на `/ads`, страницей не является.)

## GitHub-токен редактора переводов (`GITHUB_SYNC_TOKEN`)

- Кнопка «Сохранить и опубликовать» в `/admin/i18n` коммитит `src/lib/i18n.ts` в `main` от имени
  этого токена, то есть **любая утечка env прода = произвольный push в main = деплой чужого кода**.
  Поэтому: fine-grained PAT **только на репозиторий `XxHaykxX/Advertising-Platform`**, право
  ровно одно — `Contents: Read and write`, со сроком истечения (90 дней) и ротацией по истечении.
- Хранится только в hPanel Node.js env (прод) и локальном `.env`; в git не попадает.
  После ротации — обновить env и рестартнуть приложение, иначе публикация будет падать с
  «GitHub-токен недействителен или истёк».
- Детали процесса — `docs/i18n-editor.md`.

## Прочее, что нужно держать в голове

- **Индексация выключена** (noindex + robots disallow-all) — намеренно, до явной команды
  владельца. Не включать её как часть обычного деплоя. Детали и как включить —
  `docs/DEPLOY-indexing-disabled.md`.
- **Раздача загрузок** — через собственный Node-роут + переменная `UPLOADS_DIR`, потому что
  `process.cwd()/public/uploads` не совпадает с тем, что реально отдаёт Hostinger (memory
  `session-2026-07-20-poster-uploads-fix`).
- Файл-источник по SQL-миграциям — `docs/prod-migrations/*.sql`, по одному файлу на батч,
  с датой в имени.

## Грабли локальной сборки (добавлено 26.07.2026)

- **Билд падает на `/opengraph-image`** с `colourspace: parameter space not set`
  (libvips/GLib) — это **не код**, а битый кэш `.next`. Ловится после
  принудительной остановки dev-сервера. Лечится `rm -rf .next`. Падает
  стабильно, а не через раз, так что на флак списывать нельзя.
- **`npx prisma generate` → EPERM** на `query_engine-windows.dll.node`, пока
  поднят dev на 3001. Сначала проверь, не содержит ли клиент уже нужные поля:
  `grep viewCount node_modules/.prisma/client/index.d.ts`. Часто генерация
  вообще не нужна и лок можно не трогать.
- **Собрать git-worktree, подцепив `node_modules` junction'ом, нельзя** —
  Turbopack отвечает «Symlink is invalid, it points out of the filesystem
  root». Проверять сборку отдельного коммита проще в основном дереве на
  detached HEAD (`git checkout --detach <sha>`, потом `git checkout main`).
- **Дамп прод-базы**: `mysqldump` из образа mysql:8 против сервера Hostinger
  требует `--column-statistics=0`, иначе падает на
  `information_schema.COLUMN_STATISTICS` и оставляет файл ~6 КБ, который на
  вид похож на дамп. Проверять хвост файла на `-- Dump completed`.
