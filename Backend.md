# Backend — AD PLACEMENT (Kinodaran product placement)

План реализации серверной части: база данных, вывод контента из БД, заявки,
админ-панель, загрузка файлов, email, безопасность, деплой.

---

## Принятые решения (контекст)

- **Хостинг:** Hostinger **shared (Business)** с поддержкой Node.js.
- **БД:** **MySQL** и в разработке, и на проде (без различий диалекта).
- **ORM:** Prisma 6 (Prisma 7 ломает классический `url` в схеме → остаёмся на 6).
- **Фреймворк:** Next.js 16 (App Router, Server Components + Server Actions).
- **Авторизация админки:** один пароль администратора, серверная httpOnly-сессия
  (подписанный cookie, без in-memory store — переживает рестарт процесса),
  bcrypt-хэш пароля в таблице `settings`.
- **Текущее состояние:** лендинг читает статичные данные из `src/lib/projects.ts`;
  схема Prisma уже есть (SQLite); форма заявки уже постит в БД + шлёт email (dev → консоль).
  Админки нет, загрузки файлов нет, актёров/сцен/галереи в схеме нет.

### Ограничения shared-хостинга (учесть в архитектуре)

- **Сессии** — только stateless (подписанный cookie HMAC/`jose`), не in-memory.
- **Rate-limit** — in-memory (сбрасывается при рестарте) — для MVP допустимо; логин и форму защитить.
- **Загрузка файлов** — в `public/uploads/...` на постоянный диск; отдаём как статику через `<img>`
  (на сайте везде используется обычный `<img>`, не `next/image` — оптимизатор не нужен).
- **Тяжёлые видео** — только YouTube-embed; на сервере храним лишь изображения и короткие ролики.
- **`sharp`** (сжатие при загрузке) — опционально; на shared могут быть проблемы с нативным бинарником → не блокирующее.

### Заметки по безопасности

- [ ] Сменить пароль kinodaran (`hayk.karapetyan@advancedtech.am`) — засветился в чате.
- [ ] Ротировать Google API ключ (`GOOGLE_API_KEY` в `.env`) — засветился в чате.
- [ ] Все секреты — только в `.env` (не в git). Добавить `.env.example` без значений.

---

## Фаза 0 — База данных и миграции ✅

- [x] Переключить `datasource` в `prisma/schema.prisma` с `sqlite` на `mysql`.
- [x] Поднять локальный MySQL (Docker `adplatform-mysql`, MySQL 8, **порт 3307**). **Отдельная БД `adplatform_site`** — у контейнера уже была база `adplatform` с чужими таблицами (marketplace: User/Company/Listing…), её НЕ трогаем.
- [x] Выдать юзеру права на shadow-БД (`GRANT ALL ON *.* … WITH GRANT OPTION`) — нужно Prisma Migrate.
- [x] Расширить схему:
  - [x] `Project`: `gallery` (JSON-массив путей; `@db.VarChar(2048)`).
  - [x] Модель `Actor` (FK→Project, Cascade): `firstName`, `lastName`, `role`, `photo?`, `sortOrder`.
  - [x] Модель `Scene` (FK→Project, Cascade): `title`, `description`, `placement`, `sortOrder`.
  - [x] Связи `Project.actors`, `Project.scenes`.
  - [x] MySQL-нюанс: `TEXT` не может иметь `DEFAULT` → длинные тексты сделаны `@db.Text` (обязательные), JSON-массивы — `@db.VarChar(2048)` с default.
  - [x] i18n-поля для `Actor`/`Scene` — добавлены (миграция `actor_scene_i18n_default_lang`).
- [x] `prisma migrate dev --name init_mysql` — миграция создана и применена.
- [x] `prisma generate` (потребовалось остановить dev-сервер — он лочил `.dll` на Windows).
- [x] **Seed-скрипт** `prisma/seed.ts` (+ `package.json` `prisma.seed`, скрипт `npm run db:seed`); установлены `bcryptjs` (чистый JS) + `tsx`:
  - [x] 8 проектов из `src/lib/projects.ts` (24 актёра, 16 сцен).
  - [x] `portfolio` (5) и `partners` (12) плейсхолдеры.
  - [x] `settings` (контакты, соцсети, язык по умолчанию, bcrypt-хэш пароля админа из `ADMIN_PASSWORD`).
  - [ ] `content` (тексты лендинга) — отложено до Фазы 1/7.
  - [x] Парсинг `release` («Апрель 2026» → `releaseDate`); `deadlineLabel`/`release`-лейбл будут выводиться форматированием в read-слое (Фаза 1).
- [x] Проверка: 8 projects / 24 actors / 16 scenes / 5 portfolio / 12 partners / 8 settings.

---

## Фаза 1 — Публичная часть из БД (read-слой) ✅

- [x] Слой доступа к данным `src/lib/data/` (server-only, `import "server-only"`):
  - [x] `projects.ts` — `getProjects(activeOnly)`, `getProject(id)`, `getProjectIds()` (actors+scenes+gallery).
  - [x] `portfolio.ts` (`getPortfolioCases`), `partners.ts` (`getPartners`), `settings.ts` (`getSettings`/`getContacts`).
  - [x] `format.ts` — `formatReleaseLabel`, `formatDeadlineLabel`, `parseStringArray`, `youTubeId`.
  - [x] DTO-типы (client-safe) в `src/lib/types.ts`; константы в `src/lib/constants.ts`.
  - [ ] Хелпер локализации `pick(_ru,_en,_hy, locale)` — пока всегда RU (Фаза 8).
- [x] Перевести секции на серверную загрузку (Server Component → пропсы в client-компонент):
  - [x] Каталог (`catalog.tsx`) — `projects` пропом из `getProjects`.
  - [x] Страница проекта (`/projects/[id]`) — из `getProject` (актёры, сцены, галерея); `generateStaticParams` из БД.
  - [x] Портфолио (`cases`), Партнёры (`partners`) — из БД (партнёр: лого-картинка или иконка-fallback по имени).
  - [ ] Hero / «Как это работает» / заголовки / Footer — тексты из `content` (отложено в Фазу 7).
  - [ ] Header / Contacts — контакты/соцсети из `settings` (отложено в Фазу 7).
- [x] Статичный `src/lib/projects.ts` больше не импортируется компонентами (оставлен как источник для seed).
- [x] `npm run build` — успешно (home prerender из БД, `/projects/1..8` SSG); рантайм-проверка dev: home + страница проекта отдают данные из БД.

---

## Фаза 2 — Заявки (leads): доводка + админ-список ✅

- [x] Усилить `POST /api/applications`: серверная валидация, **привязка `projectId`** по `projectTitle`, **rate-limit** по IP (5/10 мин), honeypot.
- [x] Email-уведомление — уже есть (`src/lib/mailer.ts`); реальный SMTP протестируем в Фазе 9.
- [x] Админ-раздел «Заявки» (`/admin/applications`):
  - [x] Список с деталями + фильтр-табы по статусу со счётчиками.
  - [x] Смена статуса (новая / в работе / закрыта) — инлайн `StatusSelect` (server action).
  - [x] Заметки менеджера (`note`) — на странице заявки.
  - [x] Карточка заявки `/admin/applications/[id]` (все поля + сообщение).
  - [x] Экспорт в **CSV** (`/admin/applications/export`, `;`-разделитель + UTF-8 BOM для Excel).
- [x] `data/applications.ts` (list/get/statusCounts), статусы в `constants.ts`, `formatDateTime`.
- [x] Проверка Playwright (`scripts/verify-applications.mjs`): заявка через API (projectId привязан), список/деталь/заметка/CSV.

---

## Фаза 3 — Авторизация админ-панели ✅

- [x] Хранение пароля: bcrypt-хэш в `settings` (`admin_password_hash`); `src/lib/auth/password.ts` (`verifyAdminPassword`, `setAdminPassword`).
- [x] Сессия: подписанный httpOnly cookie (JWT через `jose`, edge-safe), 7 дней; `src/lib/auth/session.ts`.
- [x] Страница `/admin/login` (+ client `login-form`) + server action `login` в `src/app/admin/actions.ts`.
- [x] `src/middleware.ts` — защита `/admin/:path*` (редирект на login без сессии; авторизованного уводит с login).
- [x] Rate-limit логина (in-memory, по IP: 5 попыток / 10 мин).
- [x] Выход (logout) — очистка cookie (форма в сайдбаре панели).
- [x] Смена пароля из панели — `/admin/settings` + action `changePassword` (проверка текущего, мин. 8 символов).
- [x] Структура: route group `(site)` (Header/Footer/Lenis для лендинга) отделён от `/admin` (свой layout + панель-shell в `(panel)/`). Дашборд со счётчиками.
- [x] Проверка Playwright (`scripts/verify-admin.mjs`): неверный пароль → ошибка, верный → дашборд, защищённые страницы доступны.
- [ ] **Прод:** задать реальный `SESSION_SECRET` (длинная случайная строка) и сменить стартовый `ADMIN_PASSWORD`.

---

## Фаза 4 — Загрузка файлов (изображения) ✅

- [x] `POST /api/admin/upload` → `public/uploads/<тип>/<uuid>.<ext>`, возвращает публичный путь. Авторизация в самом роуте (`isAuthed`, т.к. middleware покрывает только `/admin/*`, не `/api`).
- [x] Валидация: тип (jpg/png/webp → 415), размер ≤5 МБ (→413), белый список подпапок (posters/gallery/portfolio/partners/actors/misc).
- [x] `src/lib/auth/require.ts` (`isAuthed`) — переиспользуемая проверка сессии.
- [x] Компоненты `ImageUpload` (одиночный) и `MultiImageUpload` (массив) в `src/components/admin/image-upload.tsx` — превью, удаление, скрытый input с путём/JSON для форм.
- [ ] (Опц.) сжатие `sharp` — пропущено (риск нативного бинарника на shared).
- [x] Папка `public/uploads/` с `.gitkeep`.
- [x] Проверка Playwright (`scripts/verify-upload.mjs`): аноним 401, авторизован 200+путь, файл отдаётся, плохой тип 415.

---

## Фаза 5 — Админ CRUD: Проекты / фильмы ✅

- [x] Список проектов (`/admin/projects`): сортировка по `sortOrder`, инлайн-переключатель активности, счётчики актёров/сцен, превью постера.
- [x] Создание (`/new`) / редактирование (`/[id]/edit`) / удаление (с подтверждением, каскад actors+scenes).
- [x] Поля формы (`project-form.tsx`):
  - [x] Название, жанр, описание, тип размещения — **3 языка** (RU основной + сворачиваемый блок EN/HY).
  - [x] Постер (`ImageUpload`); галерея кадров (`MultiImageUpload`).
  - [x] Цена + валюта (опц.).
  - [x] Слоты: всего / доступно.
  - [x] Дата выхода, дедлайн (input type=date).
  - [x] Площадки (чекбоксы YouTube/Kinodaran/TV).
  - [x] **Актёры** — повторяемый блок (имя, фамилия, роль, фото через `ImagePicker`).
  - [x] **Сцены** — повторяемый блок (название, описание, что/где размещаем).
  - [x] Порядок сортировки, статус (активен/скрыт).
- [x] Server Actions (`createProject`/`updateProject`/`deleteProject`/`toggleActive`), валидация (titleRu обязательно), revalidate публичных страниц.
- [x] Проверка Playwright (`scripts/verify-projects.mjs`): создание (отражается на сайте) → редактирование → удаление.

---

## Фаза 6 — Админ CRUD: Портфолио и Партнёры ✅

- [x] **Портфолио** (`/admin/portfolio`): название/описание (3 языка), несколько фото (`MultiImageUpload`), видео (YouTube-ссылка или URL файла), сортировка, CRUD. Подсказка про формат названия «Бренд × Фильм» (публичный сплит).
  - [ ] Загрузка видео-файла на сервер — пока только URL (upload-роут принимает только изображения; видео → YouTube/внешний URL по ТЗ).
- [x] **Партнёры** (`/admin/partners`): название, логотип (загрузка), ссылка, порядок, CRUD.
- [x] Навигация админки расширена (Проекты/Портфолио/Партнёры/Заявки/Настройки).
- [x] Проверка Playwright (`scripts/verify-portfolio-partners.mjs`): создание → отражение на сайте → удаление для обоих разделов.

---

## Фаза 7 — Админ: Тексты, Контакты, Настройки ✅

- [x] Реестр ключей `src/lib/content-keys.ts` (дефолты = текущие тексты, они же fallback).
- [x] Редактор текстов `/admin/content` (3 языка, сгруппирован: Hero / Как это работает / Каталог / Портфолио / Партнёры / Контакты / Футер).
- [x] `data/content.ts` (`getContent(locale)` — дефолты, перекрытые БД; `getContentRows` для редактора).
- [x] Подключение текстов в Hero, HowItWorks (заголовки + 3 шага), заголовки Каталог/Портфолио/Партнёры/Контакты, tagline футера.
- [x] Контакты и соцсети (`settings`) — редактор в `/admin/settings` (телефон, email, WhatsApp, Telegram, Instagram, YouTube); подключены к header, секции «Контакты», футеру.
- [x] Настройки: смена пароля (Фаза 3).
  - [x] Язык по умолчанию — select в `/admin/settings` (ключ `default_lang`), `getLocale()`: cookie → settings → RU.
- [x] Проверка Playwright (`scripts/verify-content.mjs`): правка текста и телефона → отражение на сайте, откат дефолтов.

---

## Фаза 8 — i18n (RU / EN / HY) ✅ (ядро)

- [x] Стратегия: **cookie `locale`** драйвит серверный рендер (`src/lib/i18n.ts`, `getLocale`, action `setLocale`). `html lang` из локали.
- [x] Весь редактируемый контент локализован с фолбэком на RU: `getContent(locale)`, проекты (`title/genre/placement/description` _ru/_en/_hy), портфолио. EN/HY вводятся в админке (поля уже есть в редакторах).
- [x] Переключатель языка в header и footer реально меняет язык (`setLocale` + `router.refresh()`), активный из cookie.
- [x] Статичная UI-обвязка (навигация, кнопки, фильтры каталога, заголовки футера) — встроенный словарь `UI` (ru/en/hy).
- [x] Проверка Playwright (`scripts/verify-i18n.mjs`): RU→EN→HY меняет навигацию и `html lang`, откат на RU.
- [x] **Вся UI-обвязка переведена** (карточки каталога, слоты/дедлайны/даты с локализацией Intl, страница проекта, обе формы заявки, модалка, портфолио/партнёры, «Шаг», aria-labels). Проверка `scripts/verify-i18n-coverage.mjs` — 12/12, в EN/HY нет RU-обвязки. Даты форматируются по локали (`ru-RU`/`en-GB`/`hy-AM`).
- [x] i18n-колонки для `Actor`/`Scene` (имя/фамилия/роль, название/описание/плейсмент сцен EN/HY) — миграция, read-слой с RU-fallback, EN/HY блоки в форме проекта.
- [ ] hreflang / Open Graph / sitemap — в Фазе 9 (SEO).
- [x] Выбор языка по умолчанию в админке (`default_lang`) — работает для посетителей без cookie.

---

## Фаза 9 — Безопасность, деплой, прод

**Код-часть (готово):**
- [x] Безопасность: bcrypt, httpOnly+`secure`(prod) cookie, серверная валидация форм, honeypot, rate-limit (логин 5/10мин + заявки 5/10мин), `/admin` под middleware, upload-роут проверяет сессию.
- [x] `.env.example` с документацией всех переменных.
- [x] `.gitignore` дополнен (`public/uploads/*` кроме `.gitkeep`, dev-артефакты).
- [x] SEO: `sitemap.xml` (главная + проекты, устойчив к недоступной БД), `robots.txt` (закрыт `/admin` и `/api`), Open Graph / Twitter в корневом `metadata` + `metadataBase`.
- [x] `postinstall: prisma generate` (для прод-установки).
- [x] `DEPLOY.md` — пошаговый деплой на Hostinger + чеклист безопасности.
- [x] Проверка: `robots.txt` закрывает `/admin`, `sitemap.xml` = 11 URL.

**Прод-часть (на стороне пользователя — по `DEPLOY.md`):**
- [ ] Hostinger Business: Node-приложение, переменные окружения, MySQL (создать БД/пользователя).
- [ ] `prisma migrate deploy` + `npm run db:seed` (один раз) на проде; `npm run build` → `npm run start`.
- [ ] Настроить SMTP Hostinger и протестировать письмо о заявке (реальные креды).
- [ ] Сменить стартовый `ADMIN_PASSWORD`, задать сильный `SESSION_SECRET`.
- [ ] Ротировать засветившиеся секреты (Google API ключ, пароль kinodaran).
- [ ] Регулярные бэкапы БД + `public/uploads/`.

---

## QA — глубокий аудит (логика + кнопки)

Тесты: `scripts/audit-full.mjs` (41 проверка) + `scripts/audit-deep.mjs` (44 проверки) + `scripts/verify-i18n-extra.mjs` (10 проверок: default_lang + i18n актёров/сцен) — все зелёные, 0 ошибок консоли. Селекторы аудитов обновлены под плейсхолдеры «… (RU)».

**Найдены и исправлены баги логики:**
- [x] **Скрытый проект (`isActive=false`) был доступен по прямому URL** `/projects/N` — `getProject` теперь фильтрует `isActive` → 404. Подтверждено тестом.
- [x] **Форма контактов использовала хардкод списка проектов** — новые проекты из админки не выбирались, автозаполнение ломалось. Теперь список проектов приходит из БД (`projectTitles` проп). Подтверждено (select = все проекты).
- [x] **i18n: тексты секций оставались RU при EN/HY** — добавлены EN/HY переводы в реестр контента; `getContent` использует базу по локали. Перекрытие из БД — только непустым значением (пустое EN/HY НЕ откатывает к RU). Подтверждено (EN/HY показывают переводы, держатся после сохранения текстов в админке).
- [x] Убраны предупреждения `src=""` (проекты/портфолио без картинки) — гарды на `<img>`.

**Покрыто тестами:** фильтры каталога (жанр/поиск/дедлайн/пусто), карточка «Оставить заявку» (скролл+автозаполнение без перехода), модалка заявки (Esc/X/валидация), кросс-страничная навигация header, переключение языка, заявки (фильтры статусов/смена/заметка-персист/CSV), CRUD проектов (актёры/сцены персист, на сайте, скрытие→404, удаление), CRUD портфолио/партнёров, тексты, контакты, валидация пароля (3 ветки), загрузка (401/415/200), logout.

## Итоговые модели БД (после Фазы 0/8)

- **settings** — `key`, `value` (хэш пароля, контакты, соцсети, язык по умолчанию).
- **content** — `key`, `ru`, `en`, `hy` (тексты лендинга).
- **projects** — мультиязычные поля + постер, цена/валюта, слоты, даты, площадки, дедлайн, `gallery`, sort, isActive; связи `actors`, `scenes`.
- **actors** — `projectId`, `firstName`, `lastName`, `role`, `photo`, `sortOrder`.
- **scenes** — `projectId`, `title`, `description`, `placement`, `sortOrder`.
- **portfolio** — мультиязычные поля, `images[]`, видео (youtube/file), sort.
- **partners** — `name`, `logo`, `url`, `sortOrder`.
- **applications** — `name`, `phone`, `email`, `company`, `projectId`, `projectTitle`, `budget`, `message`, `consent`, `status`, `note`, `createdAt`.
